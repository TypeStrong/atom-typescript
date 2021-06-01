let main = "./dist/main.js"
try {
  // note: require.resolve can throw for non-existent module, hence the whole try...catch dance
  if (atom.inDevMode() && require.resolve("atom-ts-transpiler")) {
    console.log("Running atom-typescript in dev-mode")
    main = "./lib/main/atomts.ts"
  }
} catch (e) {
  console.warn("Atom-TypeScript", e)
}
module.exports = require(main)
