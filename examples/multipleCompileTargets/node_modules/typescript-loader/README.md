# TypeScript Webpack Loader

TypeScript loader for Webpack.

## Example Configuration

**webpack.config.js**

```javascript
module.exports = {

  // Currently we need to add '.ts' to resolve.extensions array.
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js']
  },

  // Source maps support (or 'inline-source-map' also works)
  devtool: 'source-map',

  // Add loader for .ts files.
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'typescript-loader'
      }
    ]
  }
};
```

After that, you would be able to write JSX in TypeScript!

## Best Practices

### Using with JSX-TypeScript compiler

You can use `typescript-loader` together with
[jsx-typscript](https://github.com/fdecampredon/jsx-typescript) compiler which
has support for JSX syntax (used in React.js).

For that you need to install `jsx-typescript`:

    % npm install jsx-typescript

And specify `typescriptCompiler` loader option:

```javascript
module.exports = {

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loader: 'typescript-loader?typescriptCompiler=jsx-typescript'
      }
    ]
  }
};
```

### External Modules

The most natural way to structure your code with TypeScript and webpack is to use [external modules](https://github.com/Microsoft/TypeScript/wiki/Modules#going-external), and these work as you would expect. 

```
npm install --save react
```

```typescript
import React = require('react');
```

### Internal Modules

TypeScript Loader will work with [internal modules](https://github.com/Microsoft/TypeScript/wiki/Modules#multi-file-internal-modules) too, however acquiring a reference to modules declared this way requires some work using the `exports-loader`. This is required because webpack wraps every file in a closure and internal modules are meant to run in a global context.

**foo.ts**
```typescript
module Foo {
  export var bar = 42;
}
```

**main.ts**
```typescript
/// <reference path="foo.ts" />
var foo: typeof Foo = require('exports?Foo!./foo');
console.log(foo.bar) // 42
```
