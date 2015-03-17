[![NPM version](https://badge.fury.io/js/testla.png)](http://badge.fury.io/js/testla)
[![Dependency Status](https://david-dm.org/goatslacker/testla.png)](https://david-dm.org/goatslacker/testla)

# testla

> an opinionated and lightweight testing framework for the browser and node.js

## install

```
npm install -g testla
```


## reference

```
testla [FILE, ...]
```

Running individual tests

```
testla file1-test.js file2-test.js
```

Running all tests in folder

```
testla tests/
```


### ideas

* Modules
* Dependency Injection
* Browser, framework, and platform independent
* Intuitive and lightweight syntax


### matchers

Similar to node.js `assert`

```
fail
ok
equal
notEqual
strictEqual
notStrictEqual
deepEqual
notDeepEqual
throws
doesNotThrow
```

Other included matchers

```
isFunction
isNumber
isString
isBoolean
isArray
isObject
isArguments
isDate
isRegExp
isUndefined
isNull
isNaN
isTrue
isFalse
isEmpty
```


### custom matchers

In your `dependencies.js` file export a function which returns an object
literal of dependencies. Here you can use `assert.extend()` to create your own
custom matchers.

```js
module.exports = function (assert) {
  assert.extend({
    myCustomMatcher: function (a, b, message) {
      assert.equal(a, b, message)
    }
  })

  return {
    myDep: 1,
    otherDependency: 'hello'
  }
}
```


### spies

Spies are useful for hooking into functions and asserting that they have been
called and with the correct parameters.

To work with spies just include `spy` in your test function's parameters.

```js
var obj = { foo: function () { } }

'a spy test': function (spy) {
  var mySpy = spy.on(obj, 'foo')
  obj.foo('bar')
  mySpy.assert('bar')
}
```


### asynchronous

Relies on promises to provide asynchronous tests. One can `reject` or fail the
test or `resolve`/complete the test. Returning the promise is essential to mark
the test as asynchronous and inform testla to wait for the test to finish.

```js
'an async test': function (promise) {
  setTimeout(function () {
    promise.resolve(4)
  }, 500)

  return promise
}
```

# License

[MIT LICENSE](http://josh.mit-license.org)
