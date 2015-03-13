var asserts = require('asserts')
var fn = require('fn')
var puts = console.log

var TestStore = require('./TestStore')

TestStore.listen(function () {
  var results = TestStore.getState().results

  if (!results.length) {
    puts('No tests found')
    return
  }

  var total = fn.foldl(results, function (a, b) {
    return {
      time: a.time + b.time,
      passed: a.passed.concat(b.passed),
      failed: a.failed.concat(b.failed),
      skipped: a.skipped.concat(b.skipped)
    }
  })

  var no_passed = total.passed.length
  var no_failed = total.failed.length
  var no_skipped = total.skipped.length

  var total_tests = no_passed + no_failed + no_skipped

  if (no_passed) {
    puts('Passed')
    total.passed.forEach(function (passed) {
      puts('    √ ' + passed.name + ' ' + passed.time + 'ms')
    })
    puts('')
  }

  if (no_skipped) {
    puts('Skipped')
    total.skipped.forEach(function (skipped) {
      puts('    > ' + skipped.name)
      puts('')
    })
  }

  if (no_failed) {
    puts('Failed')
    total.failed.forEach(function (failed) {
      puts('    ✗ ' + failed.name)
      puts('')
      puts(failed.result.stack)
      puts('')
    })
  }

  puts('Results')
  puts('    * ' + total_tests + ' Test(s)')
  puts('    * ' + no_passed + ' Passed')
  puts('    * ' + no_failed + ' Failed')
  if (no_skipped) {
    puts('    * ' + no_skipped + ' Skipped')
  }
  puts('    * ' + asserts.getCount() + ' Assertions')
  puts('    * ' + total.time + 'ms Total Time')

  process.exit(no_failed ? 1 : 0)
})
