module.exports = cli

require('./reporter')

var asserts = require('asserts')
var fn = require('fn')
var fs = require('fs')
var path = require('path')
var testla = require('./testla')
var Promise = require('fantasy-promises')
var TestActions = require('./TestActions')

var existsSync = fs.existsSync || path.existsSync
var RX = /-test\.js$/

function isTestFile(file_name) {
  return RX.test(file_name)
}

function isDir(fullpath) {
  try {
    return fs.statSync(fullpath).isDirectory()
  } catch (err) {
    return null
  }
}

function loadInitialDependencies(paths) {
  var dependencyPaths = paths.map(function (name) {
    return path.resolve(path.dirname(name))
  })

  var pathsToLoad = fn.foldl(dependencyPaths, function (arr, name) {
    return arr.indexOf(name) === -1
      ? arr.concat(name)
      : arr
  }, [])

  return fn.foldl(pathsToLoad, function (dependencies, dirname) {
    return fn.mergeInto(dependencies, loadDependencies(dirname))
  }, {})
}

function loadDependency(dependency) {
  return typeof dependency == 'function'
    ? dependency(asserts)
    : dependency
}

function loadDependencies(dirname) {
  var dependenciesPath = path.resolve(dirname, 'dependencies.js')
  return existsSync(dependenciesPath)
    ? loadDependency(require(dependenciesPath))
    : {}
}

function getPromisedTest(dependencies, filepath) {
  try {
    return testla(
      filepath.replace(RX, ''),
      require(path.resolve(filepath)),
      dependencies
    )
  } catch (e) {
    console.error(filepath)
    console.error(e)
    throw e
  }
}

function traverseFiles(dependencies, file_name) {
  var fullpath = path.resolve(file_name)

  switch (isDir(fullpath)) {
    case true:
      var deps = fn.mergeInto(
        fn.mergeInto({}, dependencies),
        loadDependencies(file_name)
      )
      return fn.concatMap(fs.readdirSync(fullpath), function (x) {
        return traverseFiles(deps, path.join(file_name, x))
      })
    case false:
      return isTestFile(file_name)
        ? getPromisedTest(dependencies, file_name)
        : []
    case null:
      return []
  }
}

function liftArray(arr) {
  return fn.foldl(arr, function (a, b) {
    return fn.lift2(fn.append, a, b)
  }, Promise.of([]))
}

function run(promisedTests) {
  return liftArray(promisedTests).fork(function (results) {
    TestActions.testsComplete(results)
  }, function (e) { throw e })
}

function cli(args) {
  var dirname = process.env.PWD
  var paths = args.length ? args : fs.readdirSync(dirname)
  var getFiles = fn.curry(traverseFiles, loadInitialDependencies(paths))
  var promisedTests = fn.concatMap(paths, getFiles)

  return run(promisedTests)
}
