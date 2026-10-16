<template>
  <div :class="['basic-layout-wrapper', settings.theme, { 'basic-layout-wrapper--multi-tab': multiTabEnabled }]">
    <pro-layout
      :menus="menus"
      :collapsed="collapsed"
      :mediaQuery="query"
      :isMobile="isMobile"
      :handleMediaQuery="handleMediaQuery"
      :handleCollapse="handleCollapse"
      :i18nRender="i18nRender"
      v-bind="proLayoutSettings"
    >

      <template #menuHeaderRender>
        <div class="sidebar-logo-wrapper" :class="{ 'sidebar-logo-wrapper--collapsed': collapsed }">
          <img v-if="collapsed" :src="collapsedLogo" class="sidebar-logo sidebar-logo--collapsed" :alt="brandConfig.app_name" />
          <img v-else :src="currentLogo" class="sidebar-logo" :alt="brandConfig.app_name" />
        </div>
      </template>
      <template #headerContentRender>
        <div>
          <a-tooltip :title="$t('menu.header.refreshPage')">
            <a-icon type="reload" style="font-size: 18px;cursor: pointer;" @click="handleRefresh" />
          </a-tooltip>
        </div>
      </template>

      <a-modal :visible="showLegalModal" :footer="null" :title="$t('menu.footer.userAgreement')" @cancel="showLegalModal = false" :width="800">
        <div style="max-height: 60vh; overflow: auto; white-space: pre-wrap; line-height: 1.8; padding: 16px;">
          {{ menuFooterConfig.legal.user_agreement_text || $t('user.login.legal.content') }}
        </div>
        <div style="margin-top: 12px; text-align: right;">
          <a-button type="primary" @click="showLegalModal = false">OK</a-button>
        </div>
      </a-modal>

      <a-modal :visible="showPrivacyModal" :footer="null" :title="$t('menu.footer.privacyPolicy')" @cancel="showPrivacyModal = false" :width="800">
        <div style="max-height: 60vh; overflow: auto; white-space: pre-wrap; line-height: 1.8; padding: 16px;">
          {{ menuFooterConfig.legal.privacy_policy_text || $t('user.login.privacy.content') }}
        </div>
        <div style="margin-top: 12px; text-align: right;">
          <a-button type="primary" @click="showPrivacyModal = false">OK</a-button>
        </div>
      </a-modal>

      <setting-drawer ref="settingDrawer" :settings="settings" @change="handleSettingChange">
        <div class="setting-drawer-support">
          <div class="support-footer">
            <div class="support-block support-block--channels">
              <div class="support-socials">
                <a
                  v-for="item in supportChannelLinks"
                  :key="item.key"
                  :href="item.url"
                  :target="item.external ? '_blank' : null"
                  :rel="item.external ? 'noopener noreferrer' : null"
                  :title="item.label"
                  :aria-label="item.label"
                  class="support-social"
                  :class="'support-social--' + item.key"
                >
                  <Icon :icon="item.icon" class="support-social__icon" />
                </a>
              </div>
            </div>
            <div class="support-meta">
              <div class="support-copy">{{ menuFooterConfig.copyright }}</div>
              <div class="support-version">V{{ appVersion }}</div>
            </div>
          </div>
        </div>
      </setting-drawer>
      <template #rightContentRender>
        <div class="layout-top-actions">
          <a-dropdown
            v-if="showTopAdminShortcut"
            placement="bottomRight"
            overlayClassName="top-admin-shortcut-dropdown"
          >
            <button
              class="top-admin-shortcut"
              :class="{ 'top-admin-shortcut--active': topAdminShortcutActive }"
              type="button"
            >
              <a-icon type="setting" />
              <span>{{ topAdminTitle }}</span>
              <a-icon type="down" class="top-admin-shortcut__arrow" />
            </button>
            <a-menu slot="overlay" :selected-keys="[$route.path]" @click="handleTopAdminMenuClick">
              <a-menu-item v-for="route in topAdminRoutes" :key="route.path">
                <a-icon :type="(route.meta && route.meta.icon) || 'setting'" />
                <span>{{ route.meta && route.meta.title ? $t(route.meta.title) : route.name }}</span>
              </a-menu-item>
            </a-menu>
          </a-dropdown>
          <right-content :top-menu="settings.layout === 'topmenu'" :is-mobile="isMobile" :theme="settings.theme" />
        </div>
      </template>
      <!-- custom footer removed -->
      <template #footerRender>
        <div style="display: none;"></div>
      </template>
      <!-- Multi-tab is off by default. The settings toggle was removed, so this
           constant is the single switch; flip it to bring the tab bar back. -->
      <multi-tab v-if="multiTabEnabled" />
      <div class="basic-route-view-shell">
        <route-view :key="refreshKey" :keep-alive="multiTabEnabled" />
      </div>
    </pro-layout>

    <button
      v-if="isMobile && isDrawerOpen"
      type="button"
      class="mobile-menu-close"
      :aria-label="$t('common.close')"
      @click="closeMobileMenu"
    >
      <a-icon type="close" />
    </button>

    <div v-if="false" class="custom-menu-footer" :class="{ 'collapsed': collapsed, 'drawer-open': isMobile && isDrawerOpen, 'drawer-animating': isMobile && isDrawerAnimating }">
      <div v-if="!collapsed" class="menu-footer-content">
        <div class="footer-section" v-if="menuFooterConfig.contact.support_url || menuFooterConfig.contact.feature_request_url">
          <div class="section-title">{{ $t('menu.footer.contactUs') }}</div>
          <div class="section-links">
            <a v-if="menuFooterConfig.contact.support_url" :href="menuFooterConfig.contact.support_url" target="_blank">{{ $t('menu.footer.support') }}</a>
            <template v-if="menuFooterConfig.contact.support_url && menuFooterConfig.contact.feature_request_url">
              <span class="separator">|</span>
            </template>
            <a v-if="menuFooterConfig.contact.feature_request_url" :href="menuFooterConfig.contact.feature_request_url" target="_blank">{{ $t('menu.footer.featureRequest') }}</a>
          </div>
        </div>

        <div class="footer-section" v-if="menuFooterConfig.contact.email || menuFooterConfig.contact.telegram_url">
          <div class="section-title">{{ $t('menu.footer.getSupport') }}</div>
          <div class="section-links">
            <a v-if="menuFooterConfig.contact.email" :href="'mailto:' + menuFooterConfig.contact.email">{{ $t('menu.footer.email') }}</a>
            <template v-if="menuFooterConfig.contact.email && menuFooterConfig.contact.telegram_url">
              <span class="separator">|</span>
            </template>
            <a v-if="menuFooterConfig.contact.telegram_url" :href="menuFooterConfig.contact.telegram_url" target="_blank" rel="noopener noreferrer">{{ $t('menu.footer.telegram') }}</a>
          </div>
        </div>

        <div class="footer-section" v-if="menuFooterConfig.social_accounts && menuFooterConfig.social_accounts.length > 0">
          <div class="section-title">{{ $t('menu.footer.socialAccounts') }}</div>
          <div class="social-icons">
            <a
              v-for="(account, index) in menuFooterConfig.social_accounts"
              :key="index"
              :href="account.url"
              target="_blank"
              rel="noopener noreferrer"
              :title="account.name"
              class="social-icon"
            >
              <Icon :icon="`simple-icons:${account.icon}`" class="social-icon-svg" />
            </a>
          </div>
        </div>

        <div class="footer-section">
          <div class="section-links">
            <a
              v-if="menuFooterConfig.legal.user_agreement_url"
              :href="menuFooterConfig.legal.user_agreement_url"
              target="_blank"
              rel="noopener noreferrer"
            >{{ $t('menu.footer.userAgreement') }}</a>
            <a v-else @click="showLegalModal = true">{{ $t('menu.footer.userAgreement') }}</a>
            <span class="separator">&</span>
            <a
              v-if="menuFooterConfig.legal.privacy_policy_url"
              :href="menuFooterConfig.legal.privacy_policy_url"
              target="_blank"
              rel="noopener noreferrer"
            >{{ $t('menu.footer.privacyPolicy') }}</a>
            <a v-else @click="showPrivacyModal = true">{{ $t('menu.footer.privacyPolicy') }}</a>
          </div>
        </div>

        <div class="footer-section copyright">
          {{ menuFooterConfig.copyright }}
        </div>
        <div class="footer-section version">
          V{{ appVersion }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/* global APP_VERSION */
import { updateTheme } from '@/components/SettingDrawer/settingConfig'
import { i18nRender } from '@/locales'
import { mapState } from 'vuex'
import {
  CONTENT_WIDTH_TYPE,
  SIDEBAR_TYPE,
  TOGGLE_MOBILE_TYPE,
  TOGGLE_NAV_THEME,
  TOGGLE_LAYOUT,
  TOGGLE_FIXED_HEADER,
  TOGGLE_FIXED_SIDEBAR,
  TOGGLE_CONTENT_WIDTH,
  TOGGLE_HIDE_HEADER,
  TOGGLE_COLOR,
  TOGGLE_MULTI_TAB
} from '@/store/mutation-types'

import defaultSettings from '@/config/defaultSettings'
import RightContent from '@/components/GlobalHeader/RightContent'
import SettingDrawer from '@/components/SettingDrawer/SettingDrawer'
import MultiTab from '@/components/MultiTab'
import RouteView from './RouteView'
import { Icon } from '@iconify/vue2'
import logoLight from '@/assets/logo.png'
import logoDark from '@/assets/logo_w.png'
import slogoImg from '@/assets/slogo.png'

// Fallback channel URLs for the settings-drawer icon row when the operator
// has not set BRAND_SOCIAL_* / BRAND_CONTACT_TELEGRAM_URL. Override via env.
const DEFAULT_GITHUB_URL = 'https://github.com/knwins/TrazoomQuant'
const DEFAULT_X_URL = 'https://x.com/trazoom'
const DEFAULT_TELEGRAM_URL = 'https://t.me/trazoom'

// The multi-tab bar is hidden by default: navigating away from a page
// discards its state, which is the expected behaviour for a top-menu
// layout. The settings drawer's "整体风格设置" block exposes a switch
// that flips this via the store (TOGGLE_MULTI_TAB).
//
// Note the class binding in the template must follow this flag �?the
// `basic-layout-wrapper--multi-tab` rules in BasicLayout.less reserve
// vertical space for the tab bar, so leaving the class on while the bar
// is hidden opens a blank strip above the content.

export default {
  name: 'BasicLayout',
  components: {
    SettingDrawer,
    RightContent,
    MultiTab,
    RouteView,
    Icon
    // GlobalFooter,
    // Ads
  },
  data () {
    return {
      // preview.pro.antdv.com only use.
      isProPreviewSite: process.env.VUE_APP_PREVIEW === 'true' && process.env.NODE_ENV !== 'development',
      // end
      isDev: process.env.NODE_ENV === 'development' || process.env.VUE_APP_PREVIEW === 'true',

      // base - menus moved to computed property
      collapsed: false,
      title: defaultSettings.title,
      settings: {
        layout: defaultSettings.layout, // 'sidemenu', 'topmenu'
        // CONTENT_WIDTH_TYPE
        contentWidth: defaultSettings.layout === 'sidemenu' ? CONTENT_WIDTH_TYPE.Fluid : defaultSettings.contentWidth,
        theme: defaultSettings.navTheme,
        primaryColor: defaultSettings.primaryColor,
        fixedHeader: defaultSettings.fixedHeader,
        fixSiderbar: defaultSettings.fixSiderbar,
        multiTab: defaultSettings.multiTab,

        hideHintAlert: false,
        hideCopyButton: false
      },
      query: {},

      isMobile: false,
      showLegalModal: false,
      showPrivacyModal: false,
      refreshKey: 0,
      isDrawerOpen: false,
      isDrawerAnimating: false,
      isInitialThemeColorLoad: true
    }
  },
  computed: {
    ...mapState({
      mainMenu: state => state.permission.addRouters,
      brandConfig: state => state.brand.config
    }),
    menus () {
      const routes = this.mainMenu.find(item => item.path === '/')
      const children = (routes && routes.children) || []
      if (this.settings.layout !== 'topmenu') {
        return children
      }
      return this.buildTopMenuGroups(children)
    },
    proLayoutSettings () {
      const theme = this.settings.theme === 'realdark'
        ? 'dark'
        : (this.settings.theme === 'dark' ? 'dark' : 'light')
      return {
        ...this.settings,
        theme
      }
    },
    showAdminMenuDivider () {
      const routes = this.mainMenu.find(item => item.path === '/')
      const children = (routes && routes.children) || []
      return children.some(route => {
        if (route.hidden) return false
        const perms = (route.meta && route.meta.permission) || []
        return perms.includes('admin')
      })
    },
    menuFooterConfig () {
      return this.brandConfig
    },
    multiTabEnabled () {
      // Default to off when nothing is persisted, so a stale value from a
      // previous session never turns the bar back on unexpectedly.
      return this.multiTab === undefined ? false : this.multiTab
    },
    contactEmail () {
      return (this.brandConfig.contact || {}).email || ''
    },
    contactTelegramUrl () {
      return (this.brandConfig.contact || {}).telegram_url || DEFAULT_TELEGRAM_URL
    },
    supportChannelLinks () {
      const accounts = Array.isArray(this.menuFooterConfig.social_accounts)
        ? this.menuFooterConfig.social_accounts
        : []
      const byIcon = accounts.reduce((map, item) => {
        const key = String((item && item.icon) || '').toLowerCase()
        const url = String((item && item.url) || '').trim()
        if (key && url) map[key] = url
        return map
      }, {})
      const telegramUrl = byIcon.telegram || this.contactTelegramUrl || DEFAULT_TELEGRAM_URL
      const email = this.contactEmail
      return [
        {
          key: 'github',
          label: 'GitHub',
          icon: 'simple-icons:github',
          url: byIcon.github || DEFAULT_GITHUB_URL,
          external: true
        },
        {
          key: 'x',
          label: 'X',
          icon: 'simple-icons:x',
          url: byIcon.x || byIcon.twitter || DEFAULT_X_URL,
          external: true
        },
        {
          key: 'telegram',
          label: this.$t('menu.footer.telegram') || 'Telegram',
          icon: 'simple-icons:telegram',
          url: telegramUrl,
          external: true
        },
        email
          ? {
              key: 'email',
              label: email,
              icon: 'mdi:email-outline',
              url: `mailto:${email}`,
              external: false
            }
          : null
      ].filter(item => item && item.url)
    },
    // Support and feature-request URLs are no longer editable in Settings, so
    // the drawer's "Contact us" block is gone. These stay because the dormant
    // wide-screen .custom-menu-footer below still binds them; an operator who
    // sets BRAND_CONTACT_SUPPORT_URL in .env gets the block back there.
    contactSupportUrl () {
      return (this.brandConfig.contact || {}).support_url || ''
    },
    contactFeatureRequestUrl () {
      return (this.brandConfig.contact || {}).feature_request_url || ''
    },
    appVersion () {
      const buildVersion = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '0.0.0-dev'
      return (this.brandConfig && this.brandConfig.app_version) || defaultSettings.appVersion || buildVersion
    },
    currentLogo () {
      const theme = this.settings.theme
      const isDark = theme === 'dark' || theme === 'realdark'
      const remote = isDark
        ? (this.brandConfig.logos && this.brandConfig.logos.dark)
        : (this.brandConfig.logos && this.brandConfig.logos.light)
      return remote || (isDark ? logoDark : logoLight)
    },
    collapsedLogo () {
      return (this.brandConfig.logos && this.brandConfig.logos.collapsed) || slogoImg
    },
    topAdminPaths () {
      return ['/user-manage', '/agent-tokens', '/ai-skills', '/settings']
    },
    topAdminRoutes () {
      const routes = this.mainMenu.find(item => item.path === '/')
      const children = (routes && routes.children) || []
      const routeMap = children.reduce((map, route) => {
        map[route.path] = route
        return map
      }, {})
      return this.topAdminPaths
        .map(path => routeMap[path])
        .filter(route => route && !route.hidden)
    },
    showTopAdminShortcut () {
      return this.settings.layout === 'topmenu' && !this.isMobile && this.topAdminRoutes.length > 0
    },
    topAdminTitle () {
      return this.$t('menu.group.admin') || this.$t('menu.settings') || 'Admin'
    },
    topAdminShortcutActive () {
      return this.topAdminRoutes.some(route => this.$route.path === route.path)
    },
    activeTopMenuKey () {
      const match = this.menus.find(route => {
        if (route.path === this.$route.path) return true
        const children = route.children || []
        return children.some(child => child.path === this.$route.path)
      })
      return match ? match.path : this.$route.path
    }
  },
  created () {
    // menus is now a computed property - no need to set here
    this.settings.theme = this.$store.state.app.theme
    this.settings.primaryColor = this.$store.state.app.color || defaultSettings.primaryColor
    this.$watch('collapsed', () => {
      this.$store.commit(SIDEBAR_TYPE, this.collapsed)
    })
    this.$watch('isMobile', () => {
      this.$store.commit(TOGGLE_MOBILE_TYPE, this.isMobile)
    })
    this.$watch('$store.state.app.theme', (val) => {
      this.settings.theme = val
      if (val === 'dark' || val === 'realdark') {
        document.body.classList.add('dark')
        document.body.classList.toggle('realdark', val === 'realdark')
        document.body.classList.remove('light')
      } else {
        document.body.classList.remove('dark')
        document.body.classList.remove('realdark')
        document.body.classList.add('light')
      }
    }, { immediate: true })
    this.$watch('$store.state.app.color', (val) => {
      if (val) {
        this.settings.primaryColor = val
        document.documentElement.style.setProperty('--primary-color', val)
        if (process.env.NODE_ENV !== 'production' || process.env.VUE_APP_PREVIEW === 'true') {
          updateTheme(val, this.isInitialThemeColorLoad)
          if (this.isInitialThemeColorLoad) {
            this.isInitialThemeColorLoad = false
          }
        }
      }
    }, { immediate: true })
    this.$watch('settings.theme', (val) => {
      if (val === 'dark' || val === 'realdark') {
        document.body.classList.add('dark')
        document.body.classList.toggle('realdark', val === 'realdark')
        document.body.classList.remove('light')
      } else {
        document.body.classList.remove('dark')
        document.body.classList.remove('realdark')
        document.body.classList.add('light')
      }
    }, { immediate: true })
  },
  watch: {
    mainMenu: {
      handler () {
        this.scheduleAdminMenuDivider()
      },
      deep: true
    },
    collapsed () {
      this.scheduleAdminMenuDivider()
    },
    showAdminMenuDivider () {
      this.scheduleAdminMenuDivider()
    }
  },
  mounted () {
    const userAgent = navigator.userAgent
    if (userAgent.indexOf('Edge') > -1) {
      this.$nextTick(() => {
        this.collapsed = !this.collapsed
        setTimeout(() => {
          this.collapsed = !this.collapsed
        }, 16)
      })
    }

    // first update color
    // TIPS: THEME COLOR HANDLER!! PLEASE CHECK THAT!!

    this.$root.$on('show-setting-drawer', () => {
      if (this.$refs.settingDrawer) {
        this.$refs.settingDrawer.showDrawer()
      }
    })

    // Footer config is static for local OSS build

    this.$nextTick(() => {
      setTimeout(() => {
        this.updateMenuFooterPosition()
        this.updateAdminMenuDivider()
        this.setupAdminMenuDividerObserver()
      }, 0)
    })

    window.addEventListener('resize', this.updateMenuFooterPosition)

    if (!this.isMobile) {
      this._desktopFooterInterval = setInterval(() => {
        this.updateMenuFooterPosition()
        this.updateAdminMenuDivider()
      }, 1000)
    }

    const observer = new MutationObserver(() => {
      if (this.isMobile) {
        const drawer = document.querySelector('.ant-drawer.ant-drawer-open')
        const wasOpen = this.isDrawerOpen
        const isOpen = !!drawer

        this.isDrawerOpen = isOpen

        if (wasOpen !== this.isDrawerOpen) {
          if (this.isDrawerOpen) {
            this.isDrawerAnimating = true
            setTimeout(() => {
              this.isDrawerAnimating = false
              this.updateMenuFooterPosition()
              this.scheduleAdminMenuDivider()
            }, 300)
          } else {
            this.isDrawerAnimating = false
            this.updateMenuFooterPosition()
          }
        }
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    })

    this._menuFooterObserver = observer

    this._menuFooterInterval = setInterval(() => {
      if (this.isMobile) {
        const drawer = document.querySelector('.ant-drawer.ant-drawer-open')
        const currentState = !!drawer
        if (this.isDrawerOpen !== currentState) {
          this.isDrawerOpen = currentState
          if (currentState) {
            this.isDrawerAnimating = true
            setTimeout(() => {
              this.isDrawerAnimating = false
              this.updateMenuFooterPosition()
            }, 300)
          } else {
            this.isDrawerAnimating = false
            this.updateMenuFooterPosition()
          }
        } else if (currentState && !this.isDrawerAnimating) {
          this.updateMenuFooterPosition()
        }
      }
    }, 200)
  },
  beforeDestroy () {
    this.$root.$off('show-setting-drawer')
    window.removeEventListener('resize', this.updateMenuFooterPosition)

    if (this._menuFooterObserver) {
      this._menuFooterObserver.disconnect()
    }

    if (this._menuFooterInterval) {
      clearInterval(this._menuFooterInterval)
    }

    if (this._adminDividerObserver) {
      this._adminDividerObserver.disconnect()
      this._adminDividerObserver = null
    }

    if (this._adminDividerTimer) {
      clearTimeout(this._adminDividerTimer)
      this._adminDividerTimer = null
    }

    if (this._desktopFooterInterval) {
      clearInterval(this._desktopFooterInterval)
    }
  },
  methods: {
    i18nRender,
    buildTopMenuGroups (routes) {
      const accountMenuPaths = ['/billing', '/profile']
      const topAdminMenuPaths = ['/user-manage', '/agent-tokens', '/ai-skills', '/settings']
      const visibleRoutes = routes.filter(route => {
        return !route.hidden &&
          !accountMenuPaths.includes(route.path)
      })
      const groups = [
        {
          name: 'MenuGroupAI',
          path: '/menu-group/ai-workspace',
          title: this.$t('menu.group.aiWorkspace') || 'AI Workspace',
          icon: 'thunderbolt',
          paths: ['/ai-asset-analysis'],
          singleAsItem: true
        },
        {
          name: 'MenuGroupCommunity',
          path: '/menu-group/indicator-community',
          title: this.$t('menu.dashboard.community') || 'Marketplace',
          icon: 'shop',
          paths: ['/indicator-community'],
          singleAsItem: true
        },
        {
          name: 'MenuGroupIndicator',
          path: '/menu-group/indicator-chart',
          title: this.$t('menu.dashboard.indicatorIde') || 'Indicators',
          icon: 'line-chart',
          paths: ['/indicator-ide'],
          singleAsItem: true
        },
        {
          name: 'MenuGroupStrategy',
          path: '/menu-group/strategy-lab',
          title: this.$t('menu.group.strategyLab') || 'Strategy Lab',
          icon: 'experiment',
          paths: ['/strategy-ide'],
          singleAsItem: true
        },
        {
          name: 'MenuGroupBacktest',
          path: '/menu-group/backtest-center',
          title: this.$t('menu.dashboard.backtestCenter') || 'Backtest Center',
          icon: 'bar-chart',
          paths: ['/backtest-center'],
          singleAsItem: true
        },
        {
          name: 'MenuGroupLiveMonitor',
          path: '/menu-group/live-monitor',
          title: this.$t('menu.dashboard.strategyCenter') || 'Live Monitor',
          icon: 'fund',
          paths: ['/strategy-center'],
          singleAsItem: true
        },
        {
          name: 'MenuGroupTrading',
          path: '/menu-group/auto-trading',
          title: this.$t('menu.dashboard.brokerAccounts') || 'Broker Accounts',
          icon: 'bank',
          paths: ['/broker-accounts'],
          singleAsItem: true
        }
      ]
      const routeMap = visibleRoutes.reduce((map, route) => {
        map[route.path] = route
        return map
      }, {})
      const used = new Set()
      const groupedRoutes = groups
        .map(group => {
          const children = group.paths
            .map(path => routeMap[path])
            .filter(Boolean)
            .map(route => {
              used.add(route.path)
              return { ...route }
            })
          if (!children.length) return null
          if (group.singleAsItem && children.length === 1) {
            return children[0]
          }
          return {
            path: group.path,
            name: group.name,
            redirect: children[0].path,
            meta: {
              title: group.title,
              icon: group.icon,
              permission: children.reduce((list, route) => {
                const perms = (route.meta && route.meta.permission) || []
                perms.forEach(permission => {
                  if (!list.includes(permission)) list.push(permission)
                })
                return list
              }, [])
            },
            children
          }
        })
        .filter(Boolean)
      topAdminMenuPaths.forEach(path => used.add(path))
      const leftovers = visibleRoutes.filter(route => !used.has(route.path))
      return groupedRoutes.concat(leftovers)
    },
    handleTopAdminMenuClick ({ key }) {
      if (!key || key === this.$route.path) return
      this.$router.push({ path: key }).catch(() => {})
    },
    resolveMenuTitle (route) {
      const title = (route && route.meta && route.meta.title) || (route && route.title) || (route && route.name) || ''
      if (!title) return ''
      return this.$te && this.$te(title) ? this.$t(title) : title
    },
    updateAdminMenuDivider () {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          const menuRoots = Array.from(
            document.querySelectorAll('.ant-pro-sider .ant-menu, .ant-drawer .ant-menu')
          )
          menuRoots.forEach(root => {
            root.querySelectorAll('.sidebar-admin-divider').forEach(el => el.remove())
            if (!this.showAdminMenuDivider) return

            const profileItem = this.findProfileMenuItem(root)
            if (!profileItem) return
            if (profileItem.nextElementSibling && profileItem.nextElementSibling.classList.contains('sidebar-admin-divider')) {
              return
            }

            const divider = document.createElement('li')
            divider.className = 'ant-menu-item sidebar-admin-divider'
            divider.setAttribute('role', 'separator')
            divider.innerHTML = '<span class="sidebar-admin-divider-line" aria-hidden="true"></span>'
            profileItem.insertAdjacentElement('afterend', divider)
          })
        })
      })
    },
    findProfileMenuItem (root) {
      const routes = this.mainMenu.find(item => item.path === '/')
      const children = (routes && routes.children) || []
      const visibleRoutes = children.filter(route => !route.hidden)
      const profileIndex = visibleRoutes.findIndex(route => route.path === '/profile')
      const items = root.querySelectorAll('li.ant-menu-item:not(.sidebar-admin-divider)')
      if (profileIndex >= 0 && items[profileIndex]) {
        return items[profileIndex]
      }
      for (const li of items) {
        const link = li.querySelector('a')
        if (!link) continue
        const href = String(link.getAttribute('href') || '').toLowerCase()
        if (href.includes('/profile') || href.endsWith('profile')) {
          return li
        }
      }
      return null
    },
    scheduleAdminMenuDivider () {
      if (this._adminDividerTimer) {
        clearTimeout(this._adminDividerTimer)
      }
      this._adminDividerTimer = setTimeout(() => {
        this._adminDividerTimer = null
        this.updateAdminMenuDivider()
      }, 60)
    },
    setupAdminMenuDividerObserver () {
      if (this._adminDividerObserver) {
        this._adminDividerObserver.disconnect()
        this._adminDividerObserver = null
      }
      const menuEl = document.querySelector('.ant-pro-sider .ant-menu')
      if (!menuEl) return
      this._adminDividerObserver = new MutationObserver(() => {
        this.scheduleAdminMenuDivider()
      })
      this._adminDividerObserver.observe(menuEl, { childList: true })
    },
    updateMenuFooterPosition () {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          const menuFooter = this.$el?.querySelector('.custom-menu-footer')
          if (!menuFooter) return

          if (this.isMobile) {
            const drawer = document.querySelector('.ant-drawer.ant-drawer-open')
            this.isDrawerOpen = !!drawer

            if (drawer && !this.isDrawerAnimating) {
              // const drawerRect = drawer.getBoundingClientRect()
              menuFooter.style.position = 'fixed'
              // menuFooter.style.left = `${drawerRect.left}px`
              menuFooter.style.bottom = '0px'
              menuFooter.style.zIndex = '1001'
              menuFooter.style.display = 'block'
              menuFooter.style.opacity = '1'

              const footerHeight = menuFooter.offsetHeight || 280
              const drawerBody = drawer.querySelector('.ant-drawer-body')
              if (drawerBody) {
                drawer.style.setProperty('--footer-height', `${footerHeight}px`)
                drawerBody.style.paddingBottom = `${footerHeight + 10}px`
                drawerBody.style.overflowY = 'auto'
                drawerBody.style.overflowX = 'hidden'
                drawerBody.style.webkitOverflowScrolling = 'touch'
              }

              return
            } else if (drawer && this.isDrawerAnimating) {
              menuFooter.style.opacity = '0'
              menuFooter.style.display = 'block'
              return
            } else {
              menuFooter.style.display = 'none'
              menuFooter.style.opacity = '0'
              const drawer = document.querySelector('.ant-drawer')
              if (drawer) {
                const drawerBody = drawer.querySelector('.ant-drawer-body')
                if (drawerBody) {
                  drawerBody.style.paddingBottom = ''
                  drawerBody.style.overflowY = ''
                  drawerBody.style.overflowX = ''
                }
              }
              return
            }
          }

          const sider = this.$el?.querySelector('.ant-pro-sider') || document.querySelector('.ant-pro-sider')
          if (sider) {
            const siderRect = sider.getBoundingClientRect()
          const footerHeight = menuFooter.offsetHeight || 220
            menuFooter.style.position = 'fixed'
            menuFooter.style.left = `${siderRect.left}px`
            menuFooter.style.bottom = '0px'
            menuFooter.style.zIndex = '100'
            menuFooter.style.display = 'block'
          sider.style.setProperty('--menu-footer-height', `${footerHeight}px`)
          const siderChildren = sider.querySelector('.ant-layout-sider-children')
          if (siderChildren) {
            siderChildren.style.paddingBottom = `${footerHeight + 12}px`
            siderChildren.style.overflowY = 'auto'
            siderChildren.style.overflowX = 'hidden'
            siderChildren.style.webkitOverflowScrolling = 'touch'
          }
          const menuScroll = sider.querySelector('.ant-pro-sider-menu') ||
            sider.querySelector('.ant-menu-root') ||
            sider.querySelector('.ant-menu')
          if (menuScroll) {
            const availableHeight = Math.max(siderRect.height - footerHeight - 12, 120)
            menuScroll.style.maxHeight = `${availableHeight}px`
            menuScroll.style.overflowY = 'auto'
            menuScroll.style.overflowX = 'hidden'
            menuScroll.style.webkitOverflowScrolling = 'touch'
          }
          } else {
            menuFooter.style.position = 'fixed'
            menuFooter.style.left = '0px'
            menuFooter.style.bottom = '0px'
            menuFooter.style.zIndex = '100'
            menuFooter.style.display = 'block'
          }
        })
      })
    },
    handleRefresh () {
      this.refreshKey += 1
    },
    handleMediaQuery (val) {
      this.query = val
      if (this.isMobile && !val['screen-xs']) {
        this.isMobile = false
        this.$nextTick(() => {
          this.updateMenuFooterPosition()
        })
        return
      }
      if (!this.isMobile && val['screen-xs']) {
        this.isMobile = true
        this.collapsed = false
        this.settings.contentWidth = CONTENT_WIDTH_TYPE.Fluid
        // this.settings.fixSiderbar = false
        this.$nextTick(() => {
          this.updateMenuFooterPosition()
        })
      }
    },
    handleCollapse (val) {
      this.collapsed = val
      this.$nextTick(() => {
        this.updateMenuFooterPosition()
      })
    },
    closeMobileMenu () {
      this.handleCollapse(true)
    },
    handleMobileMenuToggle () {
      this.$nextTick(() => {
        setTimeout(() => {
          this.updateMenuFooterPosition()
        }, 300) // 等待 drawer 动画完成
      })
    },
    handleSettingChange ({ type, value }) {
      type && (this.settings[type] = value)
      switch (type) {
        case 'theme':
          this.$store.commit(TOGGLE_NAV_THEME, value)
          break
        case 'primaryColor':
          this.$store.commit(TOGGLE_COLOR, value)
          break
        case 'layout':
          this.$store.commit(TOGGLE_LAYOUT, value)
          if (value === 'sidemenu') {
            this.settings.contentWidth = CONTENT_WIDTH_TYPE.Fluid
          } else {
            this.settings.fixSiderbar = false
            this.settings.contentWidth = CONTENT_WIDTH_TYPE.Fluid
          }
          this.$store.commit(TOGGLE_CONTENT_WIDTH, this.settings.contentWidth)
          break
        case 'contentWidth':
          this.settings[type] = value
          this.$store.commit(TOGGLE_CONTENT_WIDTH, value)
          break
        case 'fixedHeader':
          this.$store.commit(TOGGLE_FIXED_HEADER, value)
          break
        case 'autoHideHeader':
          this.$store.commit(TOGGLE_HIDE_HEADER, value)
          break
        case 'fixSiderbar':
          this.$store.commit(TOGGLE_FIXED_SIDEBAR, value)
          break
        case 'multiTab':
          this.$store.commit(TOGGLE_MULTI_TAB, value)
          break
      }
    }
  }
}
</script>

<style lang="less">
@import "./BasicLayout.less";

.sidebar-logo-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  padding: 0 16px;
  box-sizing: border-box;

  .sidebar-logo {
    display: block;
    max-width: 100%;
    max-height: 40px;
    width: auto;
    height: auto;
    object-fit: contain;
  }

  .sidebar-logo--collapsed {
    max-height: 32px;
    max-width: 100%;
  }

  &--collapsed {
    justify-content: center;
    padding: 0 8px;
  }
}

::v-deep .ant-pro-sider-menu-logo {
  display: flex;
  align-items: center;
  padding-left: 0 !important;
  padding-right: 0;

  > div {
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  img {
    width: auto !important;
    height: auto !important;
    max-height: 40px;
    max-width: 85%;
  }

  h1 {
    display: none !important;
  }
}

.ant-pro-sider-menu-sider.ant-layout-sider-collapsed ::v-deep .ant-pro-sider-menu-logo {
  padding: 0 !important;
  justify-content: center;

  img {
    max-width: 80% !important;
    max-height: 32px !important;
    width: auto !important;
    height: auto !important;
  }
}

.ant-pro-sider-menu-sider.light .ant-menu-light {
  height: 60vh!important;
}
.basic-layout-wrapper {
  .ant-layout-footer {
    display: none !important;
    height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    border: none !important;
  }
}

.basic-layout-wrapper {
  position: relative;

  .custom-menu-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 100;
    width: 256px; /* 统一固定宽度 256px */
    background: #111111;
    border-top: 1px solid #1c1c1c;
    transition: left 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86),
                width 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86),
                max-width 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86),
                opacity 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86);
    max-width: 256px;
    display: block; /* 默认显示 */
    opacity: 1;

    &.collapsed {
      width: 80px; /* 折叠时菜单宽�?*/
      max-width: 80px;
    }

    @media (max-width: 768px) {
      z-index: 1001; /* drawer �?z-index 通常�?1000 */

      &:not(.drawer-open) {
        display: none !important;
        opacity: 0;
      }

      &.drawer-animating {
        opacity: 0;
        transition: opacity 0.1s ease-out;
      }

      &.drawer-open:not(.drawer-animating) {
        opacity: 1;
        transition: left 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86),
                    width 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86),
                    max-width 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86),
                    opacity 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86) 0.1s; /* 延迟 0.1s 显示，确�?drawer 先出�?*/
      }
    }

    .menu-footer-content {
      padding: 12px 16px;
      font-size: 11px;
      color: inherit;
      max-height: none;
      overflow: visible;

      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
      }

      .footer-section {
        margin-bottom: 12px;
        text-align: center;

        &:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 11px;
          font-weight: 500;
          margin-bottom: 6px;
          opacity: 0.8;
          color: inherit;
        }

        .section-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          flex-wrap: wrap;
          font-size: 10px;
          opacity: 0.7;

          a {
            cursor: pointer;
            color: inherit;
            text-decoration: underline;
            transition: opacity 0.2s;

            &:hover {
              opacity: 1;
            }
          }

          .separator {
            opacity: 0.5;
            margin: 0 2px;
          }
        }

        .social-icons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;

          .social-icon {
            width: 15px;
            height: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            cursor: pointer;
            opacity: 0.7;
            transition: all 0.2s;
            background: rgba(255, 255, 255, 0.05);
            text-decoration: none;
            overflow: hidden;

            &:hover {
              opacity: 1;
              background: rgba(255, 255, 255, 0.1);
              transform: translateY(-2px);
            }

            .social-icon-svg {
              width: 15x;
              height: 15px;
              color: currentColor;
            }

            .anticon {
              font-size: 16px;
            }

            .social-logo {
              width: 15px;
              height: 15px;
              object-fit: contain;
            }

            .social-icon-text {
              font-size: 10px;
              font-weight: bold;
            }
          }
        }

        &.copyright {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #2a2a2a;
          opacity: 0.6;
          font-size: 10px;
        }

        &.version {
          margin-top: 4px;
          font-size: 9px;
          opacity: 0.4;
          text-align: center;
          letter-spacing: 1px;
        }
      }
    }

    .menu-footer-content-collapsed {
      text-align: center;
      padding: 16px;
      font-size: 12px;
      opacity: 0.6;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      .anticon {
        font-size: 16px;
      }

      &:hover {
        opacity: 1;
      }
    }
  }

  ::v-deep .ant-pro-layout {
    &.ant-pro-sider-collapsed ~ .custom-menu-footer,
    .ant-pro-sider-collapsed ~ .custom-menu-footer {
      width: 80px;
    }
  }
}

.basic-layout-wrapper {
  ::v-deep li.ant-menu-item.sidebar-admin-divider {
    height: auto !important;
    line-height: 1 !important;
    margin: 10px 16px 12px !important;
    padding: 0 !important;
    pointer-events: none;
    cursor: default;
    list-style: none;
    overflow: hidden;

    &::after {
      display: none;
    }

    .anticon,
    .ant-menu-item-icon {
      display: none !important;
    }

    .sidebar-admin-divider-line {
      display: block;
      width: 100%;
      height: 1px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 1px;
    }
  }

  .ant-pro-sider.ant-pro-sider-collapsed {
    ::v-deep li.ant-menu-item.sidebar-admin-divider {
      margin: 8px 12px !important;
    }
  }

  .ant-layout-sider-children {
    padding-bottom: calc(var(--menu-footer-height, 220px) + 12px);
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.15) transparent;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 3px;
    }

    body.dark &,
    body.realdark &,
    .ant-pro-layout.dark &,
    .ant-pro-layout.realdark & {
      scrollbar-color: rgba(255, 255, 255, 0.25) transparent;

      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }

  .ant-pro-sider {
    height: 100vh;
    display: flex;
    flex-direction: column;

    .ant-layout-sider-children {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .ant-pro-sider-menu,
    .ant-menu-root,
    .ant-menu {
      flex: 1 1 auto;
      min-height: 0;
      max-height: calc(100vh - var(--menu-footer-height, 220px) - 24px);
      overflow-y: auto !important;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }
  }
}

.basic-layout-wrapper.dark,
.basic-layout-wrapper.realdark {
  ::v-deep li.ant-menu-item.sidebar-admin-divider .sidebar-admin-divider-line {
    background: rgba(255, 255, 255, 0.12);
  }

  .ant-layout-header {
    background: var(--qd-bg, #0f0f10) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    box-shadow: none !important;
  }
  .ant-pro-global-header {
    background: var(--qd-bg, #0f0f10) !important;
    border-bottom: none !important;
    box-shadow: none !important;
    color: rgba(255, 255, 255, 0.85) !important;

    .ant-pro-global-header-trigger {
      color: rgba(255, 255, 255, 0.85) !important;
      &:hover {
        background: rgba(255, 255, 255, 0.06) !important;
      }
    }

    .action {
      color: rgba(255, 255, 255, 0.85) !important;
      &:hover {
        background: rgba(255, 255, 255, 0.06) !important;
      }
    }
  }

  .ant-pro-basicLayout-content {
    background-color: #141414 !important;
  }

  .ant-layout {
    background-color: #141414 !important;
  }
}

@media (max-width: 768px) {
  .ant-drawer.ant-drawer-open {
    .ant-drawer-content-wrapper {
      overflow: visible;
    }

    .ant-drawer-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: visible;
    }

    .ant-drawer-wrapper-body {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: visible;
    }

    .ant-drawer-body {
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding-bottom: var(--footer-height, 280px) !important;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
      &::-webkit-scrollbar {
        width: 4px;
      }
      &::-webkit-scrollbar-track {
        background: transparent;
      }
      &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
      min-height: 0;
      flex: 1;
    }
  }
}

.setting-drawer-support {
  /* Divider above comes from SettingDrawer's <a-divider />; avoid a second rule.
     Grow to fill the drawer so tech-support + copyright sit on the panel bottom. */
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  margin-top: 4px;
  padding-top: 4px;
  color: rgba(15, 23, 42, 0.72);

  .support-footer {
    margin-top: auto;
    /* Keep a little air under the copyright so the block reads higher. */
    padding-bottom: 12px;
  }

  .support-block--channels {
    /* Sit the tech-support block a bit higher above the copyright rule. */
    margin-bottom: 28px;
  }

  .support-title {
    margin-bottom: 12px;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
    color: rgba(15, 23, 42, 0.88);
  }

  .support-socials {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .support-social {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    border-radius: 10px;
    color: rgba(15, 23, 42, 0.78);
    background: linear-gradient(180deg, #ffffff 0%, #f5f7fa 100%);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
    transition: transform 0.16s ease, color 0.16s ease, border-color 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;

    .support-social__icon {
      width: 16px;
      height: 16px;
    }

    &:hover {
      transform: translateY(-1px);
      color: var(--primary-on-color, #fff);
      border-color: var(--primary-color, #0f9ea8);
      background: var(--primary-color, #0f9ea8);
      box-shadow: 0 6px 14px color-mix(in srgb, var(--primary-color, #0f9ea8) 28%, transparent);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .support-social--github:hover {
    background: #111827;
    border-color: #111827;
    color: #fff;
    box-shadow: 0 6px 14px rgba(17, 24, 39, 0.22);
  }

  .support-social--x:hover {
    background: #0f1419;
    border-color: #0f1419;
    color: #fff;
    box-shadow: 0 6px 14px rgba(15, 20, 25, 0.22);
  }

  .support-social--telegram:hover {
    background: #229ed9;
    border-color: #229ed9;
    color: #fff;
    box-shadow: 0 6px 14px rgba(34, 158, 217, 0.28);
  }

  .support-social--email:hover {
    background: var(--primary-color, #0f9ea8);
    border-color: var(--primary-color, #0f9ea8);
    color: var(--primary-on-color, #fff);
    box-shadow: 0 6px 14px color-mix(in srgb, var(--primary-color, #0f9ea8) 28%, transparent);
  }

  .support-meta {
    margin-top: 0;
    padding-top: 14px;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
  }

  .support-copy {
    font-size: 11px;
    line-height: 1.55;
    color: rgba(100, 116, 139, 0.82);
  }

  .support-version {
    margin-top: 6px;
    font-size: 10px;
    letter-spacing: 0.06em;
    line-height: 1.4;
    color: rgba(100, 116, 139, 0.58);
  }
}

body.dark .setting-drawer-support,
body.realdark .setting-drawer-support,
.basic-layout-wrapper.dark .setting-drawer-support,
.basic-layout-wrapper.realdark .setting-drawer-support {
  color: rgba(226, 232, 240, 0.72);

  .support-title {
    color: rgba(248, 250, 252, 0.92);
  }

  .support-social {
    color: rgba(226, 232, 240, 0.86);
    border-color: rgba(255, 255, 255, 0.12);
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.03) 100%);
    box-shadow: none;

    &:hover {
      color: var(--primary-on-color, #14181c);
      border-color: var(--primary-color, #ffffff);
      background: var(--primary-color, #ffffff);
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
    }
  }

  .support-social--github:hover,
  .support-social--x:hover {
    color: #fff;
  }

  .support-social--telegram:hover {
    color: #fff;
    background: #229ed9;
    border-color: #229ed9;
  }

  .support-social--email:hover {
    color: var(--primary-on-color, #14181c);
    background: var(--primary-color, #ffffff);
    border-color: var(--primary-color, #ffffff);
  }

  .support-meta {
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  .support-copy {
    color: rgba(148, 163, 184, 0.78);
  }

  .support-version {
    color: rgba(148, 163, 184, 0.58);
  }
}

</style>
