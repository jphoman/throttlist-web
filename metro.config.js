const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Metro uses `unstable_enablePackageExports: true` which means it respects
// each package's `exports` field.  Without explicit condition names, Metro can
// resolve packages to their ESM (`import`) output instead of their CJS
// (`require`) output.  For a native iOS bundle we always want CJS so hermesc
// (Hermes AOT compiler) never sees raw `import()` expressions or ESM syntax.
//
// Adding 'require' here tells Metro: when a package exports both `import` and
// `require` conditions, prefer `require` (CJS).  Fixes @supabase/supabase-js
// and any other package with the same pattern.
config.resolver.unstable_conditionNames = [
  'require',
  ...config.resolver.unstable_conditionNames,
]

// @tanstack/query-core and @tanstack/react-query ship private class fields
// (#prop syntax) in their `exports`-field "modern" build.  hermesc rejects
// these.  The `main` field points to a "legacy" build with identical runtime
// behaviour but no private fields.
// Map package names to their CommonJS builds.  When Metro's exports-field
// resolution picks an ESM build (which hermesc can't compile) we redirect it
// here so the native bundle always uses CJS.
const CJS_OVERRIDES = {
  // @tanstack modern build has private class fields; legacy build has neither
  '@tanstack/react-query': path.join(
    __dirname,
    'node_modules/@tanstack/react-query/build/legacy/index.cjs'
  ),
  '@tanstack/query-core': path.join(
    __dirname,
    'node_modules/@tanstack/query-core/build/legacy/index.cjs'
  ),
  // @supabase/supabase-js exports field picks dist/index.mjs (contains a
  // dynamic import() for OpenTelemetry) instead of dist/index.cjs (which uses
  // require() so hermesc handles it fine)
  '@supabase/supabase-js': path.join(
    __dirname,
    'node_modules/@supabase/supabase-js/dist/index.cjs'
  ),
}

const { resolveRequest: upstreamResolveRequest } = config.resolver ?? {}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (CJS_OVERRIDES[moduleName]) {
    return { type: 'sourceFile', filePath: CJS_OVERRIDES[moduleName] }
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform)
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
