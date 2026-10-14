// Card metadata for the "Open Account" modal (profile -> exchange signup).
//
// Signup URLs are intentionally NOT hardcoded here. They are deployment
// configuration: the backend exposes them via /api/settings/brand-config
// (exchange_signup_urls, fed by EXCHANGE_SIGNUP_* env vars or the admin
// Settings page). An empty URL keeps the card's button disabled — never ship
// upstream referral links in this file.
export const CRYPTO_SIGNUP_CARDS = [
  {
    id: 'binance',
    name: 'Binance',
    short: 'BN',
    brandBg: 'rgba(243, 186, 47, 0.16)',
    brandColor: '#f0b90b',
    signupUrl: ''
  },
  {
    id: 'bitget',
    name: 'Bitget',
    short: 'BG',
    brandBg: 'rgba(0, 193, 255, 0.14)',
    brandColor: '#00c1ff',
    signupUrl: ''
  },
  {
    id: 'bybit',
    name: 'Bybit',
    short: 'BY',
    brandBg: 'rgba(247, 166, 0, 0.14)',
    brandColor: '#f7a600',
    signupUrl: ''
  },
  {
    id: 'okx',
    name: 'OKX',
    short: 'OK',
    brandBg: 'rgba(17, 24, 39, 0.08)',
    brandColor: '#111827',
    signupUrl: ''
  },
  {
    id: 'gate',
    name: 'Gate.io',
    short: 'GT',
    brandBg: 'rgba(42, 93, 255, 0.12)',
    brandColor: '#2a5dff',
    signupUrl: ''
  }
]

/** @deprecated Use CRYPTO_SIGNUP_CARDS */
export const EXCHANGE_SIGNUP_CARDS = [...CRYPTO_SIGNUP_CARDS]
