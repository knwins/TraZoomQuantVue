import router, {
  resetRouter
} from './router'
import store from './store'
import storage from 'store'
import NProgress from 'nprogress' // progress bar
import '@/components/NProgress/nprogress.less' // progress bar custom style
import {
  setDocumentTitle,
  domTitle
} from '@/utils/domUtil'
import {
  ACCESS_TOKEN
} from '@/store/mutation-types'
import {
  i18nRender
} from '@/locales'
import { promptChangeInitialPassword } from '@/utils/initialPasswordReminder'
import notification from 'ant-design-vue/es/notification'
import { timeFix } from '@/utils/util'
import {
  APP_HOME,
  appReturnPath,
  clearDevLoginTries,
  readAuthParam,
  startAccountLogin,
  stripWindowAuthParams
} from '@/utils/accountLogin'

NProgress.configure({
  showSpinner: false
}) // NProgress Configuration

const allowList = ['PublicProfessionalReport'] // no redirect allowList
const defaultRoutePath = APP_HOME

router.beforeEach((to, from, next) => {
  NProgress.start() // start progress bar
  const routeTitle = to.meta && typeof to.meta.title !== 'undefined' ? i18nRender(to.meta.title) : ''
  setDocumentTitle(routeTitle ? `${routeTitle} - ${domTitle}` : domTitle)

  // Check whether we have a token (local-only auth).
  let token = storage.get(ACCESS_TOKEN)
  if (token && typeof token !== 'string') {
    token = token.token || token.value || (typeof token === 'object' ? null : token)
  }
  token = typeof token === 'string' ? token : null

  const oauthToken = readAuthParam('oauth_token')
  const oauthError = readAuthParam('oauth_error')
  if (oauthToken || oauthError) {
    if (oauthToken) {
      storage.set(ACCESS_TOKEN, oauthToken, new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
      token = oauthToken
      notification.success({
        message: 'Welcome',
        description: `${timeFix()}, welcome back.`
      })
    }
    stripWindowAuthParams()
    const query = { ...to.query }
    delete query.oauth_token
    delete query.oauth_error
    next({ path: appReturnPath(to.path), query, replace: true })
    NProgress.done()
    return
  }

  if (to.path === '/user/login' || to.path === '/user') {
    next({ path: defaultRoutePath, replace: true })
    NProgress.done()
    return
  }

  if (token) {
    if (store.getters.roles.length === 0) {
      store.dispatch('GetInfo')
        .then(res => {
          clearDevLoginTries()
          // const roles = res && res.role
          promptChangeInitialPassword()
          store.dispatch('GenerateRoutes', { token }).then(() => {
            resetRouter() // 重置路由
            store.getters.addRouters.forEach(r => {
              router.addRoute(r)
            })
            const redirect = decodeURIComponent(from.query.redirect || to.path)
            if (to.path === redirect) {
              next({ ...to, replace: true })
            } else {
              next({ path: redirect })
            }
          })
        })
        .catch((err) => {
          // If token is invalid/expired, clear local auth and start account login.
          const status = err && err.response && err.response.status
          if (status === 401) {
            store.dispatch('Logout').finally(() => {
              startAccountLogin(to.fullPath)
              next(false)
              NProgress.done()
            })
            return
          }

          // Do NOT hard-logout on transient failures (backend down, proxy issue, etc).
          // Instead, degrade gracefully with a default role and continue.
          store.commit('SET_ROLES', [{ id: 'default', permissionList: [] }])
          store.dispatch('GenerateRoutes', { token }).then(() => {
            resetRouter()
            store.getters.addRouters.forEach(r => router.addRoute(r))
            next({ ...to, replace: true })
          }).catch(() => {
            next()
          })
        })
    } else {
      const addRouters = store.getters.addRouters
      if (!addRouters || addRouters.length === 0) {
        store.dispatch('GenerateRoutes', { token }).then(() => {
          resetRouter() // 重置路由 防止退出重新登录或者 token 过期后页面未刷新，导致的路由重复添加
          store.getters.addRouters.forEach(r => {
            router.addRoute(r)
          })
          next({ ...to, replace: true })
        }).catch(() => {
          next()
        })
      } else {
        next()
      }
    }
  } else if (allowList.includes(to.name)) {
    next()
  } else {
    startAccountLogin(to.fullPath)
    next(false)
    NProgress.done()
  }
})

router.afterEach(() => {
  NProgress.done() // finish progress bar
})
