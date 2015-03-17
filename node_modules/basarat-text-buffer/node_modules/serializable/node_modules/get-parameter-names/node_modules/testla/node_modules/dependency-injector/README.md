di
==

JavaScript dependency injection


## Install

    npm install dependency-injector


## Usage

    var DI = require('dependency-injector')
    var di = new DI()

    di.register({ foo: 2 })

    var functionWithDependency = di.inject(function (foo) {
      return foo
    })

    functionWithDependency == 2 // true


## API

### `register(name, fn)` | `register(dependencies)`

Registers your dependencies with the current instance of DI.

    register('foo', 2)
    register({ foo: 2 })

### `getParameterNames(fn)`

Utility function to retrieve parameter names from a function.

    getParameterNames(function (foo, bar, baz) { }) // == ['foo', 'bar', 'baz']

### `inject(fn, additionalDependencies)`

Creates a function that is loaded with the dependencies. You may pass in
additional dependencies at this point.

    inject(function (foo + bar) { return foo + bar }, { bar: 3 })

### `clone()`

Clones the current set of dependencies into its own object.

    var anotherInstance = clone()


## License

[MIT](http://josh.mit-license.org)
