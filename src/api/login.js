import request from '@/utils/request'

const userApi = {
  Logout: '/api/auth/logout',
  UserInfo: '/api/auth/info'
}

export function getInfo () {
  return request({
    url: userApi.UserInfo,
    method: 'get',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}

// Backward-compatible alias: some modules still call getUserInfo()
export function getUserInfo () {
  return getInfo()
}

export function logout () {
  return request({
    url: userApi.Logout,
    method: 'post',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8'
    }
  })
}
