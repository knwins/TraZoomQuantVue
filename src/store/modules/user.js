import storage from 'store'
import expirePlugin from 'store/plugins/expire'
import { logout, getUserInfo } from '@/api/login'
import { ACCESS_TOKEN, USER_INFO, USER_ROLES } from '@/store/mutation-types'
import { welcome } from '@/utils/util'

storage.addPlugin(expirePlugin)

const DEFAULT_ROLE = { id: 'default', permissionList: [] }

function normalizeRoles (roles) {
  if (!roles) return []
  if (Array.isArray(roles)) return roles
  return [roles]
}

function getStoredInfo () {
  const info = storage.get(USER_INFO) || {}
  return (info && typeof info === 'object') ? info : {}
}

function getStoredRoles () {
  const roles = storage.get(USER_ROLES) || []
  return normalizeRoles(roles)
}

function getStoredToken () {
  const token = storage.get(ACCESS_TOKEN)
  return typeof token === 'string' ? token : (token && token.token) ? token.token : token
}

function displayNameFromInfo (info) {
  if (!info || typeof info !== 'object') return ''
  const nickname = String(info.nickname || '').trim()
  if (nickname) return nickname
  // Account-center identity: prefer email over legacy local usernames.
  const email = String(info.email || '').trim()
  if (email) return email
  return String(info.username || '').trim()
}

const initialInfo = getStoredInfo()
// If is_demo is missing (legacy cache), force roles to empty to trigger GetInfo in permission.js
let initialRoles = getStoredRoles()
if (initialInfo && typeof initialInfo.is_demo === 'undefined') {
  initialRoles = []
}
const initialToken = getStoredToken() || ''
const initialName = displayNameFromInfo(initialInfo)
const initialAvatar = initialInfo.avatar || ''
const initialWelcome = initialName ? welcome() : ''
const user = {
  state: {
    token: initialToken,
    name: initialName,
    welcome: initialWelcome,
    avatar: initialAvatar,
    roles: initialRoles,
    info: initialInfo
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_NAME: (state, { name, welcome }) => {
      state.name = name
      state.welcome = welcome
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    },
    SET_INFO: (state, info) => {
      state.info = info
    }
  },

  actions: {
    FetchUserInfo ({ commit }) {
      return new Promise((resolve, reject) => {
        getUserInfo().then(res => {
          if (res && res.code === 1 && res.data) {
            const info = res.data
            commit('SET_INFO', info)
            const expiresAt = new Date().getTime() + 7 * 24 * 60 * 60 * 1000
            storage.set(USER_INFO, info, expiresAt)
            const name = displayNameFromInfo(info)
            if (name) {
              commit('SET_NAME', { name, welcome: welcome() })
            }
            if (info.avatar) {
              commit('SET_AVATAR', info.avatar)
            }
            resolve(info)
          } else {
            reject(new Error((res && res.msg) || '获取用户信息失败'))
          }
        }).catch(err => reject(err))
      })
    },

    GetInfo ({ commit, state }) {
      return new Promise((resolve, reject) => {
        if (
          state.info &&
          Object.keys(state.info).length > 0 &&
          typeof state.info.is_demo !== 'undefined' &&
          typeof state.info.must_change_initial_password !== 'undefined'
        ) {
          const info = state.info
          if (info.role) {
            const roles = normalizeRoles(info.role)
            commit('SET_ROLES', roles)
            storage.set(USER_ROLES, roles, new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          } else if (info.roles) {
            const roles = normalizeRoles(info.roles)
            commit('SET_ROLES', roles)
            storage.set(USER_ROLES, roles, new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          } else {
            commit('SET_ROLES', [DEFAULT_ROLE])
            storage.set(USER_ROLES, [DEFAULT_ROLE], new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
          }
          resolve(state.info)
        } else {
          getUserInfo().then(res => {
            if (res && res.code === 1 && res.data) {
              const info = res.data
              commit('SET_INFO', info)
              storage.set(USER_INFO, info, new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
              const name = displayNameFromInfo(info)
              if (name) {
                commit('SET_NAME', { name, welcome: welcome() })
              }
              if (info.avatar) {
                commit('SET_AVATAR', info.avatar)
              }
              if (info.role) {
                const roles = normalizeRoles(info.role)
                commit('SET_ROLES', roles)
                storage.set(USER_ROLES, roles, new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
              } else if (info.roles) {
                const roles = normalizeRoles(info.roles)
                commit('SET_ROLES', roles)
                storage.set(USER_ROLES, roles, new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
              } else {
                commit('SET_ROLES', [DEFAULT_ROLE])
                storage.set(USER_ROLES, [DEFAULT_ROLE], new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
              }
              resolve(info)
            } else {
              reject(new Error((res && res.msg) || '用户信息不存在'))
            }
          }).catch(err => reject(err))
        }
      })
    },

    Logout ({ commit, dispatch }) {
      return new Promise((resolve) => {
        const finish = (logoutUrl) => {
          commit('SET_TOKEN', '')
          commit('SET_ROLES', [])
          commit('SET_INFO', {})
          commit('SET_NAME', { name: '', welcome: '' })
          commit('SET_AVATAR', '')
          storage.remove(ACCESS_TOKEN)
          storage.remove(USER_INFO)
          storage.remove(USER_ROLES)
          dispatch('ResetRoutes')
          resolve(logoutUrl || '')
        }
        logout().then((res) => {
          const logoutUrl = res && res.data && res.data.logout_url
          finish(logoutUrl)
        }).catch(() => {
          finish('')
        })
      })
    }

  }
}

export default user
