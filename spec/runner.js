// Atom already has the capability to require("foo.ts") files, but it's using typescript-simple package at version 1.0,
// that is instead using Typescript 1.4. We want to use whatever version is specified in out package.json, so we kick out
// the typescript-simple handler and install our own via ts-node.
var path = require("path")

if (require.extensions[".ts"]) {
  // Because <insert reason>, the ".ts" extension property is read only and not configurable, so we have to replace the
  // whole extensions object to get rid of it.
  var extensions = {}

  for (var ext in require.extensions) {
    if (ext !== ".ts") {
      extensions[ext] = require.extensions[ext]
    }
  }

  require("module")._extensions = extensions
}

// Finally, register ts-node handler
const {register} = require("ts-node")

register({
  project: __dirname
})

// Configure test runner and export the runner function
var createRunner = require('atom-mocha-test-runner').createRunner

var extraOptions = {
  testSuffixes: ['spec.js', 'spec.coffee', 'spec.ts']
}

var optionalConfigurationFunction = function (mocha) {
  // If provided, atom-mocha-test-runner will pass the mocha instance
  // to this function, so you can do whatever you'd like to it.
}

module.exports = createRunner(extraOptions, optionalConfigurationFunction)
