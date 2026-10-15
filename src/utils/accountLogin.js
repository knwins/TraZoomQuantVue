export const APP_HOME = '/ai-asset-analysis'

const LOGIN_PATHS = new Set(['', '/', '/user', '/user/login', '/404'])

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

export function startAccountLogin (path) {
  const hashPath = appReturnPath(path)
  const target = `${window.location.origin}${window.location.pathname}#${hashPath}`
  window.location.replace(`/api/auth/login?redirect=${encodeURIComponent(target)}`)
}
