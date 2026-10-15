import storage from 'store'
import { ACCESS_TOKEN } from '@/store/mutation-types'

export const APP_HOME = '/ai-asset-analysis'

const LOGIN_PATHS = new Set(['', '/', '/user', '/user/login', '/404'])
const DEV_LOGIN_TRIES = 'qd-dev-login-tries'

export function readAuthParam (name) {
  const search = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams((window.location.hash.split('?')[1] || ''))
  return search.get(name) || hashParams.get(name) || ''
}

export function appReturnPath (path) {
  const value = String(path || '').split('?')[0]
  if (LOGIN_PATHS.has(value)) return APP_HOME
  return value.startsWith('/') ? value : `/${value}`
}

export function stripWindowAuthParams () {
  const url = new URL(window.location.href)
  url.searchParams.delete('oauth_token')
  url.searchParams.delete('oauth_error')
  if (url.hash.includes('?')) {
    const [hashPath, hashQuery] = url.hash.split('?')
    const params = new URLSearchParams(hashQuery)
    params.delete('oauth_token')
    params.delete('oauth_error')
    const rest = params.toString()
    url.hash = rest ? `${hashPath}?${rest}` : hashPath
  }
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
}

function redirectToAccountCenter (path) {
  const hashPath = appReturnPath(path)
  const target = `${window.location.origin}${window.location.pathname}#${hashPath}`
  window.location.replace(`/api/auth/login?redirect=${encodeURIComponent(target)}`)
}

export function clearDevLoginTries () {
  try {
    window.sessionStorage.removeItem(DEV_LOGIN_TRIES)
  } catch (error) {
    // Session storage can be unavailable in private browsing.
  }
}

function startDevUserLogin (path) {
  let tries = 0
  try {
    tries = Number(window.sessionStorage.getItem(DEV_LOGIN_TRIES) || '0')
    if (tries >= 2) {
      window.sessionStorage.removeItem(DEV_LOGIN_TRIES)
      redirectToAccountCenter(path)
      return
    }
    window.sessionStorage.setItem(DEV_LOGIN_TRIES, String(tries + 1))
  } catch (error) {
    redirectToAccountCenter(path)
    return
  }
  fetch('/api/auth/dev-login', {
    method: 'POST',
    headers: { Accept: 'application/json' }
  }).then(response => response.ok ? response.json() : null).then(body => {
    const token = body && typeof body.token === 'string' ? body.token : ''
    if (!token) {
      redirectToAccountCenter(path)
      return
    }
    storage.set(ACCESS_TOKEN, token, Date.now() + 7 * 24 * 60 * 60 * 1000)
    window.location.reload()
  }).catch(() => {
    redirectToAccountCenter(path)
  })
}

export function startAccountLogin (path) {
  if (import.meta.env.DEV) {
    startDevUserLogin(path)
    return
  }
  redirectToAccountCenter(path)
}
