import message from 'ant-design-vue/es/message'
// import defaultSettings from '../defaultSettings';
import themeColor from './themeColor.js'
import i18n from '@/locales'

// let lessNodesAppended
// Accent colours offered in the settings drawer. Kept to the three the
// TrazoomQuant brand actually uses; the palette is intentionally short so the
// row stays on one line inside the 300px drawer without wrapping.
//
// #0f9ea8 also doubles as the default (see primaryColor in
// src/config/defaultSettings.js), so the first swatch is what a fresh
// install renders with.
const getColorList = () => {
  return [
    {
      key: i18n.t('app.setting.themecolor.teal'), color: '#0f9ea8'
    },
    {
      key: i18n.t('app.setting.themecolor.green'), color: '#12a331'
    },
    {
      key: i18n.t('app.setting.themecolor.graphite'), color: '#3f413f'
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
