if (atom.inDevMode() && require.resolve("atom-ts-transpiler")) {
  console.log("Running atom-typescript in dev-mode")
  module.exports = require("./lib/main/atomts.ts")
} else {
  module.exports = require("./dist/main.js")
}
