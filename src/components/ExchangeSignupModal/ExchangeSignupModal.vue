<template>
  <a-modal
    :title="$t('profile.exchange.openAccountTitle')"
    :visible="visible"
    :wrap-class-name="modalWrapClass"
    :footer="null"
    width="480px"
    @cancel="handleCancel"
  >
    <div class="exchange-signup-modal">
      <p class="exchange-signup-promo">{{ $t('profile.exchange.openAccountPromo') }}</p>
      <p class="exchange-signup-hint">{{ $t('profile.exchange.signupSectionCryptoHint') }}</p>

      <div class="exchange-signup-list" role="list">
        <button
          v-for="item in cryptoCards"
          :key="item.id"
          type="button"
          role="listitem"
          class="exchange-signup-row"
          :class="{ 'is-disabled': !item.signupUrl }"
          :disabled="!item.signupUrl"
          :title="item.signupUrl ? item.name : $t('profile.exchange.openAccountUnavailable')"
          @click="openSignupLink(item.signupUrl)"
        >
          <span class="exchange-signup-logo">
            <provider-logo :provider="item.id" :size="20" />
            <span
              v-if="!hasLogo(item.id)"
              class="exchange-signup-logo__fallback"
              :style="{ color: item.brandColor }"
            >{{ item.short }}</span>
          </span>

          <span class="exchange-signup-meta">
            <span class="exchange-signup-name">{{ item.name }}</span>
            <span v-if="!item.signupUrl" class="exchange-signup-status">
              {{ $t('profile.exchange.openAccountUnavailable') }}
            </span>
          </span>

          <span v-if="item.signupUrl" class="exchange-signup-cta">
            {{ $t('profile.exchange.openAccountButton') }}
            <a-icon type="right" />
          </span>
          <span v-else class="exchange-signup-cta exchange-signup-cta--muted" aria-hidden="true">
            <a-icon type="lock" />
          </span>
        </button>
      </div>
    </div>
  </a-modal>
</template>

<script>
import { CRYPTO_SIGNUP_CARDS } from '@/constants/exchangeSignupCards'
import { getProviderLogo } from '@/constants/providerLogos'
import ProviderLogo from '@/components/ProviderLogo/ProviderLogo.vue'
import { mapState } from 'vuex'

export default {
  name: 'ExchangeSignupModal',
  components: { ProviderLogo },
  props: {
    visible: { type: Boolean, default: false },
    isDarkTheme: { type: Boolean, default: false }
  },
  computed: {
    ...mapState({
      brandConfig: state => state.brand.config
    }),
    // Referral links come from deployment configuration (EXCHANGE_SIGNUP_* /
    // admin Settings page) via brand-config. A card without a configured URL
    // renders disabled instead of silently routing users to a third-party link.
    cryptoCards () {
      const urls = (this.brandConfig && this.brandConfig.exchange_signup_urls) || {}
      return CRYPTO_SIGNUP_CARDS.map(card => ({
        ...card,
        signupUrl: String(urls[card.id] || '').trim()
      }))
    },
    modalWrapClass () {
      const base = 'profile-exchange-modal'
      return this.isDarkTheme ? `${base} ${base}--dark` : base
    }
  },
  watch: {
    visible (val) {
      if (val) {
        // Force refresh so admin-updated EXCHANGE_SIGNUP_* links appear without
        // requiring a full page reload (LoadBrandConfig no-ops once loaded).
        this.$store.dispatch('LoadBrandConfig', { force: true })
      }
    }
  },
  methods: {
    hasLogo (id) {
      return Boolean(getProviderLogo(id))
    },
    handleCancel () {
      this.$emit('update:visible', false)
    },
    openSignupLink (url) {
      const safe = String(url || '').trim()
      if (!/^https?:\/\//i.test(safe)) return
      window.open(safe, '_blank', 'noopener,noreferrer')
    }
  }
}
</script>

<style lang="less">
@exchange-dark-border: rgba(255, 255, 255, 0.12);
@exchange-dark-title: #e8edf2;
@exchange-dark-muted: rgba(255, 255, 255, 0.5);

.profile-exchange-modal {
  .ant-modal-header {
    padding: 16px 20px 12px;
    border-bottom: 1px solid var(--qd-border, #e4e9ef);
  }

  .ant-modal-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--qd-text, #1c2430);
    line-height: 1.4;
  }

  .ant-modal-body {
    padding: 14px 20px 18px;
  }

  .ant-modal-close-x {
    width: 48px;
    height: 48px;
    line-height: 48px;
  }
}

.exchange-signup-modal {
  .exchange-signup-promo {
    margin: 0 0 6px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--qd-text, #1c2430);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.45;
    text-align: left;
  }

  .exchange-signup-hint {
    margin: 0 0 14px;
    color: var(--qd-text-secondary, #5d6b7a);
    font-size: 12px;
    line-height: 1.55;
  }

  .exchange-signup-list {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--qd-border, #e4e9ef);
    border-radius: 10px;
    background: var(--qd-surface, #ffffff);
    overflow: hidden;
  }

  .exchange-signup-row {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 52px;
    margin: 0;
    padding: 10px 14px;
    border: 0;
    border-bottom: 1px solid var(--qd-border, #e4e9ef);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.15s ease;
    appearance: none;
    -webkit-appearance: none;

    &:last-child {
      border-bottom: 0;
    }

    &:hover:not(.is-disabled),
    &:focus:not(.is-disabled) {
      background: var(--qd-surface-hover, #eef2f5);
      outline: none;
    }

    &:focus-visible:not(.is-disabled) {
      background: var(--qd-surface-hover, #eef2f5);
      box-shadow: inset 0 0 0 2px rgba(22, 119, 255, 0.28);
    }

    &.is-disabled {
      cursor: default;
      background: var(--qd-surface-subtle, #f6f8fa);
    }
  }

  .exchange-signup-logo {
    position: relative;
    flex: 0 0 36px;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--qd-surface-subtle, #f6f8fa);
    border: 1px solid var(--qd-border, #e4e9ef);
    overflow: hidden;

    .provider-logo {
      display: block;
    }
  }

  .exchange-signup-logo__fallback {
    font-size: 12px;
    font-weight: 700;
  }

  .exchange-signup-meta {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 0;
  }

  .exchange-signup-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--qd-text, #1c2430);
    line-height: 1.35;
  }

  .exchange-signup-status {
    font-size: 12px;
    color: var(--qd-text-muted, #8b97a6);
    line-height: 1.35;
  }

  .exchange-signup-cta {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--primary-color, #1677ff);
    font-size: 13px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;

    .anticon {
      font-size: 10px;
      opacity: 0.85;
    }
  }

  .exchange-signup-cta--muted {
    width: 28px;
    height: 28px;
    justify-content: center;
    color: var(--qd-text-muted, #8b97a6);

    .anticon {
      font-size: 13px;
      opacity: 1;
    }
  }

  .exchange-signup-row.is-disabled .exchange-signup-name {
    color: var(--qd-text-secondary, #5d6b7a);
    font-weight: 500;
  }

  .exchange-signup-row.is-disabled .exchange-signup-logo {
    opacity: 0.72;
  }
}

@media (max-width: 640px) {
  .profile-exchange-modal {
    .ant-modal {
      max-width: calc(100vw - 24px);
      margin: 12px auto;
    }

    .ant-modal-body {
      padding: 12px 14px 16px;
    }
  }

  .exchange-signup-modal {
    .exchange-signup-row {
      min-height: 50px;
      padding: 10px 12px;
      gap: 10px;
    }

    .exchange-signup-cta:not(.exchange-signup-cta--muted) {
      font-size: 12px;
    }
  }
}

.profile-exchange-modal--dark {
  .ant-modal-header {
    border-bottom-color: @exchange-dark-border;
  }

  .ant-modal-title {
    color: @exchange-dark-title;
  }

  .exchange-signup-modal {
    .exchange-signup-promo {
      color: @exchange-dark-title;
    }

    .exchange-signup-hint {
      color: @exchange-dark-muted;
    }

    .exchange-signup-list {
      background: #171717;
      border-color: @exchange-dark-border;
    }

    .exchange-signup-row {
      border-bottom-color: @exchange-dark-border;

      &:hover:not(.is-disabled),
      &:focus:not(.is-disabled) {
        background: #1f1f1f;
      }

      &.is-disabled {
        background: #141414;
      }
    }

    .exchange-signup-logo {
      background: #1f1f1f;
      border-color: @exchange-dark-border;
    }

    .exchange-signup-name {
      color: @exchange-dark-title;
    }

    .exchange-signup-status,
    .exchange-signup-cta--muted {
      color: @exchange-dark-muted;
    }

    .exchange-signup-cta:not(.exchange-signup-cta--muted) {
      color: #69b1ff;
    }

    .exchange-signup-row.is-disabled .exchange-signup-name {
      color: @exchange-dark-muted;
    }
  }
}
</style>
