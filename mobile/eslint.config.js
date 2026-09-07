const expoConfig = require("eslint-config-expo/flat");
const { defineConfig, globalIgnores } = require("eslint/config");

module.exports = defineConfig([
  globalIgnores(["node_modules/**", ".expo/**", "dist/**", "web-build/**"]),
  expoConfig,
  {
    rules: {
      // import/namespace re-parses every imported module via a bare
      // require("@typescript-eslint/parser") that isn't resolvable while
      // typescript is pinned to the 7.x preview (see mobile/package.json's
      // "overrides" for why @typescript-eslint's own tooling can't hoist to
      // root here). It errors on every TS import rather than checking
      // anything real, so it's off until the toolchain supports TS 7.
      "import/namespace": "off",
    },
  },
]);
