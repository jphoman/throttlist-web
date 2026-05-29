// Polyfills for React Native / Hermes — must be imported before any
// packages that rely on browser globals (e.g. @supabase/realtime-js).

// DOMException — used by @supabase/realtime-js
if (typeof global.DOMException === 'undefined') {
  // @ts-ignore
  global.DOMException = class DOMException extends Error {
    constructor(message?: string, name?: string) {
      super(message)
      this.name = name ?? 'DOMException'
    }
  }
}
