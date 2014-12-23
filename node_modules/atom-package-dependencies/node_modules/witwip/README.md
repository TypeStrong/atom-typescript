witwip - Where in the world is package.json?
============================================

[![build status](https://secure.travis-ci.org/cpsubrian/node-witwip.png)](http://travis-ci.org/cpsubrian/node-witwip)

Find package.json files relative to your current module or some other basepath.
Search for local modules, search for modules installed with npm, or just find
the closest package.json to the current file.

Initial code for `witwip` was copied almost verbatim from [architect](https://github.com/c9/architect), so, thanks guys :)


API
---

### witwip([base], [modulePath], callback)
- **base** - The module object or path to start searching from (optional).
- **modulePath** - The module name or local path to look for (optional).
- **callback** - function (err, pkgPath, pkgData)

### witwip.dir([base], [modulePath], callback)
Same as `witwip()` but returns the directory instead of the filepath of the
found package.json.


Usage
-----

```js
var findPkg = require('witwip');

// Find the closest package.json to this module.
findPkg(function(err, pkgPath, pkgData) {

});
// or
findPkg(module, function(err, pkgPath, pkgData) {

});
// or
findPkg(__dirname, function(err, pkgPath, pkgData) {

});

// Look for the package.json of a dependency.
findPkg(module, 'optimist', function(err, pkgPath, pkgData) {

});
// or
findPkg(__dirname, 'optimist', function(err, pkgPath, pkgData) {

});

// Check if a local dir is a module (has a package.json).
findPkg(module, './local/dir/mymodule', function(err, pkgPath, pkgData) {

});

// Find the package.json of the parent module to this module.
findPkg(module.parent, function(err, pkgPath, pkgData) {

});
```


- - -

### Developed by [Terra Eclipse](http://www.terraeclipse.com)
Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

- - -

### License: MIT
Copyright (c) 2012 ajax.org B.V

Copyright (C) 2012 Terra Eclipse, Inc. ([http://www.terraeclipse.com](http://www.terraeclipse.com))

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.