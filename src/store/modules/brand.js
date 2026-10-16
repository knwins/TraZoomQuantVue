import { getBrandConfig } from '@/api/brand'

const BUILD_APP_VERSION = typeof APP_VERSION !== 'undefined' ? APP_VERSION : '0.0.0-dev'

// Mirrors BRAND_DEFAULTS['copyright'] in the backend, which rewrites the year
// on read. Keep the two in step.
const currentYear = new Date().getFullYear()
const DEFAULT_COPYRIGHT = `© ${currentYear} Trazoom Quant. All rights reserved.`

// First 4-digit year, or a 4-digit range such as "2025-2026". Only the digits
// are matched so the © / (c) mark survives.
const YEAR_RANGE = /\d{4}(?:\s*[-–—]\s*\d{4})?/

function normalizeCopyright (value) {
  const text = String(value || '').trim()
  if (!text) return DEFAULT_COPYRIGHT
  // Refresh the year client-side too: this string can arrive from the backend
  // (which already did it), from a cached localStorage payload, or from an
  // operator who typed a literal year in BRAND_COPYRIGHT.
  return text.replace(YEAR_RANGE, String(currentYear))
}

/**
 * Defaults match the values the backend would return if every BRAND_* env
 * var were empty.  Keeping them here as a fallback lets the first-paint of
 * the app render the layout even if the brand-config request hasn't returned
 * yet (or fails entirely).
 */
const DEFAULT_BRAND = {
  app_name: 'Trazoom Quant',
  app_version: BUILD_APP_VERSION,
  copyright: DEFAULT_COPYRIGHT,
  logos: {
    light: '',
    dark: '',
    collapsed: '',
    favicon: ''
  },
  // Trazoom Quant is a private deployment that is not publicly distributed.
  // Contact and social entries stay empty so the sidebar renders no links,
  // matching the backend defaults in app/services/settings/branding.py.
  contact: {
    email: '',
    support_url: '',
    feature_request_url: '',
    telegram_url: ''
  },
  social_accounts: [],
  // Exchange referral links for the "Open Account" modal. Empty by default —
  // mirrors the backend defaults in app/services/settings/branding.py.
  exchange_signup_urls: {},
  legal: {
    user_agreement_url: '',
    user_agreement_text: '',
    privacy_policy_url: '',
    privacy_policy_text: ''
  },
  mobile_app: {
    latest_version: '',
    download_url: ''
  }
}

// Namespaced per product. The v2 suffix drops a cache that still carried the
// previous display name, so first paint uses the current default.
const STORAGE_KEY = 'trazoomquant.brand-config.v2'

function readCachedBrand () {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed
  } catch (_) { /* ignore */ }
  return null
}

function persistBrand (data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (_) { /* ignore quota / private-mode */ }
}

function normalizeBrand (data) {
  const brand = data && typeof data === 'object' ? data : DEFAULT_BRAND
  return {
    ...brand,
    app_version: brand.app_version || BUILD_APP_VERSION,
    copyright: normalizeCopyright(brand.copyright)
  }
}

/**
 * Reflect brand config into <title> and <link rel="icon">. Both are no-ops in
 * SSR or test environments where ``document`` doesn't exist.
 */
function applyBrandToDocument (data) {
  if (typeof document === 'undefined') return
  if (data && data.app_name) {
    document.title = data.app_name
  }
  const faviconUrl = data && data.logos && data.logos.favicon
  if (faviconUrl) {
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'icon')
      document.head.appendChild(link)
    }
    link.setAttribute('href', faviconUrl)
  }
}

const cachedBrand = readCachedBrand()
const initialBrand = normalizeBrand(cachedBrand
  ? { ...cachedBrand, app_version: BUILD_APP_VERSION }
  : DEFAULT_BRAND)
// Apply cached brand to <title>/<favicon> immediately on module load so the
// browser tab matches the deployment before the brand-config request returns.
applyBrandToDocument(initialBrand)

// In-flight brand-config fetch. Kept module-local (not in Vuex state) so
// concurrent LoadBrandConfig calls can await / chain without storing a Promise
// in the store.
let brandLoadPromise = null

const brand = {
  state: {
    // Start from the cached payload if available, then DEFAULT_BRAND.
    // Hydrate ASAP so the first paint of <BasicLayout> already shows the
    // correct logo/title even before the network call returns.
    config: initialBrand,
    loaded: false,
    loading: false
  },

  mutations: {
    SET_BRAND_LOADING (state, loading) {
      state.loading = !!loading
    },
    SET_BRAND_CONFIG (state, payload) {
      state.config = normalizeBrand(payload || DEFAULT_BRAND)
      state.loaded = true
      persistBrand(state.config)
      applyBrandToDocument(state.config)
    }
  },

  actions: {
    /**
     * Fetch brand config from the backend and cache it.
     * - `force=true` re-fetches even if already loaded (used after admin saves
     *   settings).
     */
    async LoadBrandConfig ({ commit, state }, opts = {}) {
      if (state.loaded && !opts.force) return state.config
      // Reuse an in-flight fetch unless the caller needs a forced refresh after
      // it settles (modal open / settings save).
      if (brandLoadPromise && !opts.force) return brandLoadPromise
      if (brandLoadPromise && opts.force) {
        try { await brandLoadPromise } catch (_) { /* ignore */ }
      }

      commit('SET_BRAND_LOADING', true)
      brandLoadPromise = (async () => {
        try {
          const res = await getBrandConfig()
          if (res && res.code === 1 && res.data) {
            // Shallow-merge over defaults so a partial response still works.
            // social_accounts is NOT treated as a fallback-able field: an empty
            // array from the backend means "operator configured no social links",
            // so we must honour it. Falling back to DEFAULT_BRAND here would
            // resurrect hardcoded third-party links on a private deployment.
            const merged = {
              ...DEFAULT_BRAND,
              ...res.data,
              logos: { ...DEFAULT_BRAND.logos, ...(res.data.logos || {}) },
              contact: { ...DEFAULT_BRAND.contact, ...(res.data.contact || {}) },
              legal: { ...DEFAULT_BRAND.legal, ...(res.data.legal || {}) },
              mobile_app: { ...DEFAULT_BRAND.mobile_app, ...(res.data.mobile_app || {}) },
              exchange_signup_urls: {
                ...DEFAULT_BRAND.exchange_signup_urls,
                ...(res.data.exchange_signup_urls || {})
              },
              social_accounts: Array.isArray(res.data.social_accounts)
                ? res.data.social_accounts
                : DEFAULT_BRAND.social_accounts
            }
            commit('SET_BRAND_CONFIG', merged)
          }
        } catch (e) {
          // Brand-config is non-critical: keep cached / default values and let
          // the app keep working.
          // eslint-disable-next-line no-console
          console.warn('LoadBrandConfig failed, falling back to defaults:', e)
        } finally {
          commit('SET_BRAND_LOADING', false)
          brandLoadPromise = null
        }
        return state.config
      })()
      return brandLoadPromise
    }
  }
}

export default brand
export { DEFAULT_BRAND }
