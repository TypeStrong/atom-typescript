## Docs
Official docs : https://github.com/atom/space-pen / http://atom.github.io/space-pen/

## Gotchas

* The `outlet` option does not work on root. `this` is the root jq element
* `initialize` is called after the view is attached to the DOM. The body of the `constructor` executes *after* `initialize` gets called (due to `super()`) so you cannot do `public something` as an argument to constructor. Our workaround is to have an `init` function called from the base view *after* the call to space-pen's `super`. So `init` is where we have the dom available in the clients.
* Tip: You generally want views to be singletons and *not* take options.  So don't have an `init` function.
* You need to add the class `native-key-bindings` to your *custom* views for input elements backspace to work and text selection / copy paste to work.
