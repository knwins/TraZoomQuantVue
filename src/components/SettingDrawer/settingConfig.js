import message from 'ant-design-vue/es/message'
// import defaultSettings from '../defaultSettings';
import themeColor from './themeColor.js'
import i18n from '@/locales'

// let lessNodesAppended
// Accent colours offered in the settings drawer. Kept short so the row
// stays on one line inside the 300px drawer.
//
// #0f9ea8 also doubles as the default (see primaryColor in
// src/config/defaultSettings.js), so the first swatch is what a fresh
// install renders with. #2ecfcf is a brighter cyan tuned for dark chrome
// (higher luminance on #0e151c shells while still keeping white on-primary).
const getColorList = () => {
  return [
    {
      key: i18n.t('app.setting.themecolor.teal'), color: '#0f9ea8'
    },
    {
      key: i18n.t('app.setting.themecolor.nightCyan'), color: '#2ecfcf'
    },
    {
      key: i18n.t('app.setting.themecolor.green'), color: '#12a331'
    }
  ]
}

const updateTheme = (newPrimaryColor, silent = false) => {
  const hideMessage = silent ? null : message.loading(i18n.t('app.setting.theme.switching'), 0)
  themeColor.changeColor(newPrimaryColor).finally(() => {
    if (hideMessage) {
      setTimeout(() => {
        hideMessage()
      }, 10)
    }
  })
}

export { updateTheme, getColorList }
