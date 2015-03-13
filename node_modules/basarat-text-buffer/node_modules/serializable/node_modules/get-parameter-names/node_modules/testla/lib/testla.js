module.exports = testla

//+ @type TestResult = {name: String, time: Number, passed: Array, failed: Array, skipped: Array}
//+ @type Dependencies = Object
//+ @type Tests = {Function} | Function
//+ @type Promise = {fork: Function}
//+ @type DI = {register: Function, inject: Function}
var assert = require('asserts')
var fn = require('fn')
var DI = require('dependency-injector')
var Observer = require('observer')
var Promise = require('fantasy-promises')

var INCOMPLETE = {}
var PASSED = 1
var FAILED = 2
var SKIPPED = 3

//+ prepareTests :: DI, Tests -> { run: Function }
function prepareTests(instance, tests) {
  var mapOfTests = typeof tests === 'function'
    ? instance.inject(tests).call()
    : tests

  return { run: fn.curry(runAllTests, mapOfTests) }
}

//+ foldPromises :: Function, [Promise], Any -> Promise
function foldPromises(f, arr, acc) {
  return fn.foldl(arr, function (a, b) {
    return fn.lift2(f, a, b)
  }, Promise.of(acc))
}

//+ runAllTests :: Tests, Function, Function -> Promise
function runAllTests(tests, runner, formatter) {
  var promisedTests = fn.pairs(tests).map(runner)
  var accumulator = { passed: [], failed: [], skipped: [], time: 0 }
  var reduce = function (a, b) { return fn.foldl([a, b], formatter) }

  return foldPromises(reduce, promisedTests, accumulator)
}

//+ computeResult :: String, Number, Any -> TestResult
function computeResult(name, startTime, result) {
  var test = {
    name: name,
    time: Date.now() - startTime
  }
  var report = fn.mergeInto({}, test)

  test.failed = []
  test.passed = []
  test.skipped = []

  if (result instanceof Error) {
    report.status = FAILED
    test.failed.push(report)
  } else if (result === INCOMPLETE) {
    report.status = SKIPPED
    test.skipped.push(report)
  } else {
    report.status = PASSED
    test.passed.push(report)
  }

  report.result = result

  return test
}

//- runTest :: DI, [String, Function] -> Promise TestResult
//+ runTest :: DI, [String, Function] -> Promise
function runTest(instance, testPair) {
  var name = testPair[0]
  var test_fn = testPair[1]

  // skip tests that begin with an underscore
  if (name[0] === '_') {
    return Promise.of(computeResult(name, Date.now(), INCOMPLETE))
  }

  return new Promise(function (resolve) {
    var startTime = Date.now()
    var doResolve = fn.comp(resolve, function (value) {
      return computeResult(name, startTime, value)
    })
    var promise = { resolve: doResolve }

    try {
      var result = instance.inject(test_fn, {
        promise: promise,
        spy: new Observer()
      }).call()

      return result === promise ? null : doResolve(result)
    } catch (e) {
      return doResolve(e)
    }
  })
}

//+ getFormatter :: String -> Function -> Object, Object -> TestResult
function getFormatter(name) {
  return function (a, b) {
    return {
      name: name,
      time: a.time + b.time,
      passed: a.passed.concat(b.passed),
      failed: a.failed.concat(b.failed),
      skipped: a.skipped.concat(b.skipped)
    }
  }
}

//+ testla :: String, Tests, Dependencies -> Promise
function testla(name, tests, dependencies) {
  var instance = new DI(fn.mergeInto({ assert: assert }, dependencies))
  var runner = fn.curry(runTest, instance)

  return prepareTests(instance, tests).run(runner, getFormatter(name))
}
