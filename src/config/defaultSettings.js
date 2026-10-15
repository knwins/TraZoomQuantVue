
export const PYTHON_API_BASE_URL = process.env.VUE_APP_PYTHON_API_BASE_URL || 'http://localhost:5000'
const BUILD_APP_VERSION = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '0.0.0-dev'

export default {
  /** Web UI release label (footer, docs cross-reference). */
  appVersion: BUILD_APP_VERSION,
  navTheme: 'realdark', // theme for nav menu
  // TraZoom Quant accent. Matches the first swatch in the settings drawer's
  // palette (src/components/SettingDrawer/settingConfig.js); a fresh install
  // renders in this colour until the operator picks another.
  primaryColor: '#0f9ea8', // primary color of ant design
  layout: 'topmenu', // nav menu position: `sidemenu` or `topmenu`
  contentWidth: 'Fluid', // layout of content: `Fluid` or `Fixed`, only works when layout is topmenu
  fixedHeader: true, // sticky header - 固定顶部导航栏
  fixSiderbar: false, // sticky sidebar
  // Multi-tab is off by default; the settings drawer's "整体风格设置" block
  // exposes a switch. Turning it on also enables the keep-alive route cache.
  multiTab: false,
  menu: {
    locale: true
  },
  title: 'Trazoom Quant',
  pwa: false,
  iconfontUrl: '',
  production: process.env.NODE_ENV === 'production' && process.env.VUE_APP_PREVIEW !== 'true'

}
