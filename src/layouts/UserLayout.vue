<template>
  <div
    id="userLayout"
    :class="['user-layout-wrapper', isMobile && 'mobile']"
    :style="{ '--login-accent': themeAccent }"
  >
    <div class="user-layout-lang">
      <select-lang class="select-lang-trigger" />
    </div>

    <div class="auth-stage">
      <header class="identity">
        <a href="/" class="brand-link" :aria-label="brandConfig.app_name">
          <img :src="loginLogo" class="brand-logo" :alt="brandConfig.app_name">
        </a>
        <p class="welcome">{{ $t('user.login.hero.welcome', { name: brandConfig.app_name || 'Trazoom Quant' }) }}</p>
      </header>

      <main class="user-layout-content">
        <router-view />
      </main>

      <footer class="legal-footer">
        <span>{{ brandConfig.copyright }}</span>
      </footer>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { deviceMixin } from '@/store/device-mixin'
import SelectLang from '@/components/SelectLang'
import defaultLogo from '@/assets/logo.svg'

export default {
  name: 'UserLayout',
  components: {
    SelectLang
  },
  mixins: [deviceMixin],
  computed: {
    ...mapState({
      brandConfig: state => state.brand.config
    }),
    themeAccent () {
      // Deepened wordmark green. The app teal reads cold beside the green
      // mark and the warm page.
      return '#0e7c34'
    },
    loginLogo () {
      const logos = (this.brandConfig && this.brandConfig.logos) || {}
      return logos.light || defaultLogo
    }
  },
  mounted () {
    document.body.classList.add('userLayout')
  },
  beforeDestroy () {
    document.body.classList.remove('userLayout')
  }
}
</script>

<style lang="less" scoped>
#userLayout.user-layout-wrapper {
  min-height: 100vh;
  color: #1c1f1c;
  background:
    radial-gradient(760px 380px at 50% -12%, rgba(18, 163, 49, 0.12), transparent 70%),
    #f3f1ec;

  .auth-stage,
  .user-layout-content {
    box-sizing: border-box;
  }

  .auth-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 88px 24px 36px;
  }

  .identity {
    width: ~"min(420px, 100%)";
    margin-bottom: 22px;
    text-align: center;
  }

  .brand-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .brand-logo {
    display: block;
    width: auto;
    height: 52px;
    max-width: 100%;
  }

  .welcome {
    margin: 14px 0 0;
    color: #5f655f;
    font-size: 15px;
    line-height: 1.5;
  }

  .user-layout-content {
    width: ~"min(420px, 100%)";
  }

  .user-layout-lang {
    position: absolute;
    top: 22px;
    right: 22px;
    z-index: 2;

    .select-lang-trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 36px;
      min-width: 64px;
      min-height: 36px;
      padding: 0 12px;
      line-height: 36px;
      color: #3d433d;
      font-size: 14px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid rgba(28, 31, 28, 0.08);
      border-radius: 999px;
      backdrop-filter: blur(8px);
    }
  }

  .legal-footer {
    width: ~"min(420px, 100%)";
    margin-top: 18px;
    color: #8b908b;
    font-size: 12px;
    line-height: 1.6;
    text-align: center;
  }
}

@media (max-width: 576px) {
  #userLayout.user-layout-wrapper {
    .auth-stage {
      justify-content: flex-start;
      padding: 76px 16px 28px;
    }

    .brand-logo {
      height: 44px;
    }

    .welcome {
      font-size: 14px;
    }

    .user-layout-lang {
      top: 14px;
      right: 14px;
    }
  }
}
</style>
