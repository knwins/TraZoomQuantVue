import './index.less'

import { Icon, Menu, Dropdown } from 'ant-design-vue'
import { i18nRender, supportedLocales } from '@/locales'
import i18nMixin from '@/store/i18n-mixin'

const SelectLang = {
  props: {
    prefixCls: {
      type: String,
      default: 'ant-pro-drop-down'
    }
  },
  name: 'SelectLang',
  mixins: [i18nMixin],
  render () {
    const { prefixCls } = this
    const changeLang = ({ key }) => {
      this.setLang(key)
    }
    const handleKeydown = event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.click()
      }
    }
    const langMenu = (
      <Menu class={['menu', 'ant-pro-header-menu']} selectedKeys={[this.currentLang]} onClick={changeLang}>
        {supportedLocales.map(locale => (
          <Menu.Item key={locale.value}>
            <span class="language-code" aria-label={locale.label}>
              {locale.icon}
            </span>
            {locale.label}
          </Menu.Item>
        ))}
      </Menu>
    )
    const current = supportedLocales.find(locale => locale.value === this.currentLang)
    const currentLabel = current ? current.short : 'EN'
    const title = `${i18nRender('navBar.lang')} · ${current ? current.label : 'English'}`
    return (
      <Dropdown overlay={langMenu} placement="bottomRight" trigger={['click']}>
        <span class={[prefixCls, 'language-action']} title={title} aria-label={title} role="button" tabIndex="0" onKeydown={handleKeydown}>
          <Icon type="global" class="language-action-icon" />
          <span class="language-action-label">{currentLabel}</span>
        </span>
      </Dropdown>
    )
  }
}

export default SelectLang
