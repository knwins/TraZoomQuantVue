<template>
  <div class="main">
    <div class="auth-card">
      <div v-if="oauthProcessing" class="oauth-processing">
        <a-spin size="large" />
        <p>{{ $t('user.oauth.processing') || 'Processing login...' }}</p>
      </div>
      <div v-else class="account-login">
        <a-alert
          v-if="oauthError"
          type="error"
          showIcon
          style="margin-bottom: 24px;"
          :message="oauthError"
        />
        <a-button
          size="large"
          type="primary"
          block
          class="submit-button"
          @click="startAccountLogin"
        >
          {{ $t('user.login.submit') || 'Login' }}
        </a-button>
      </div>
    </div>
  </div>
</template>

<script>
import storage from 'store'
import { ACCESS_TOKEN } from '@/store/mutation-types'
import { timeFix } from '@/utils/util'

export default {
  name: 'Login',
  data () {
    return {
      oauthProcessing: false,
      oauthError: ''
    }
  },
  mounted () {
    this.consumeAccountCallback()
  },
  methods: {
    queryValue (name) {
      const urlParams = new URLSearchParams(window.location.search)
      const hashQuery = (window.location.hash.split('?')[1] || '')
      const hashParams = new URLSearchParams(hashQuery)
      return urlParams.get(name) || hashParams.get(name) || this.$route.query[name] || ''
    },
    consumeAccountCallback () {
      const oauthToken = this.queryValue('oauth_token')
      const oauthError = this.queryValue('oauth_error')
      if (oauthError) {
        this.oauthError = this.$t(`user.oauth.error.${oauthError}`) || this.$t('user.oauth.error.login_failed') || 'Login failed'
        this.clearAuthQuery()
        return
      }
      if (!oauthToken) {
        this.startAccountLogin()
        return
      }
      this.oauthProcessing = true
      storage.set(ACCESS_TOKEN, oauthToken, new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
      this.clearAuthQuery()
      this.$store.dispatch('GetInfo').then(() => {
        const redirect = this.$route.query.redirect
        this.$router.push({ path: redirect || '/' })
        this.$notification.success({
          message: 'Welcome',
          description: `${timeFix()}, welcome back.`
        })
      }).catch(err => {
        this.oauthProcessing = false
        this.oauthError = 'Failed to get user info'
        console.error('Account login error:', err)
        storage.remove(ACCESS_TOKEN)
      })
    },
    clearAuthQuery () {
      const hashPath = (window.location.hash || '#/user/login').split('?')[0]
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search.split('?')[0]}${hashPath}`)
    },
    startAccountLogin () {
      const redirect = encodeURIComponent(window.location.origin)
      window.location.assign(`/api/auth/login?redirect=${redirect}`)
    }
  }
}
</script>

<style lang="less" scoped>
.main {
  width: 100%;
}
.auth-card {
  width: 100%;
}
.oauth-processing,
.account-login {
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.account-login {
  align-items: stretch;
}
.submit-button {
  height: 44px;
}
</style>
