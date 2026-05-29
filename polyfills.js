// Metro polyfill — runs before ANY module initialization.
// Must be plain JS (no imports/exports).

// DOMException — used by @supabase/realtime-js and undici
if (typeof global.DOMException === 'undefined') {
  global.DOMException = (function () {
    function DOMException(message, name) {
      this.message = message || ''
      this.name = name || 'DOMException'
    }
    DOMException.prototype = Object.create(Error.prototype)
    DOMException.prototype.constructor = DOMException
    return DOMException
  })()
}

// MemoryInfo — used by React Native Performance API
if (typeof global.MemoryInfo === 'undefined') {
  global.MemoryInfo = function MemoryInfo() {
    this.totalJSHeapSize = 0
    this.usedJSHeapSize = 0
    this.jsHeapSizeLimit = 0
  }
}

// Performance / PerformanceObserver stubs
if (typeof global.Performance === 'undefined') {
  global.Performance = function Performance() {}
}
if (typeof global.PerformanceObserver === 'undefined') {
  global.PerformanceObserver = function PerformanceObserver() {
    this.observe = function () {}
    this.disconnect = function () {}
  }
  global.PerformanceObserver.supportedEntryTypes = []
}

// EventTarget stub (needed by some web-compat packages)
if (typeof global.EventTarget === 'undefined') {
  global.EventTarget = function EventTarget() {
    this._listeners = {}
  }
  global.EventTarget.prototype.addEventListener = function () {}
  global.EventTarget.prototype.removeEventListener = function () {}
  global.EventTarget.prototype.dispatchEvent = function () { return true }
}
