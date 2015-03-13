# Fantasy Promises

This library implements purely functional, monadic promises.

## `Promise(fork)`

Promise is a constructor which takes a `fork` function. The `fork`
function takes one argument:

### `fork(resolve)`

The `resolve` callback gets called on a value.

### `Promise.of(x)`

Creates a Promise that contains a successful value.

### `chain(f)`

Returns a new promise that evaluates `f` when the current promise
is successfully fulfilled. `f` must return a new promise.

### `map(f)`

Returns a new promise that evaluates `f` on a value and passes it
through to the resolve function.

### `extract()`

Executes a promise to get a value.

### `extend(f)`

Returns a new promise that evaluates `f` over the promise to get a
value.

## Fantasy Land Compatible

[
  ![](https://raw.github.com/pufuwozu/fantasy-land/master/logo.png)
](https://github.com/pufuwozu/fantasy-land)
