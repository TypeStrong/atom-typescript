###atom-package-dependencies

Allows Atom package developers to enforce dependence on other Atom packages, similar to dependence on Node packages.

Include other Atom packages that you want to be installed when making your package.

###Usage

####Depending on other packages

1. In the root-level `package.json`, include `"atom-package-dependencies": "latest"`

2. Include an object `"package-dependencies"` and list the Atom packages your package depends on by name. Note that versioning is not yet supported, so if any version is installed, this is satisfied.

3. Run the `install` function from within your package to force update (see example below).

####Requiring other packages

Use the `apd.require` function to access commands from other packages.

```js
var apd = require('atom-package-dependencies');

var mdp = apd.require('markdown-preview');
mdp.toggle();
```

###Examples

Example excerpt of `package.json`:

```json
...

"dependencies": {
  "atom-package-dependencies": "latest"
},

"package-dependencies": {
  "merge-conflicts": "//version specification coming soon",
  "color-picker": "//this field will be ignored right now"
}

...
```
<br>Javascript example of forcing package installation:

```js
var apd = require('atom-package-dependencies');
apd.install();
```

###Notes

- This will install the listed Atom packages in the `.../.atom/packages/` directory. This means the packages are actually installed in the end-user's Atom like normal, rather than in a `node_modules` folder inside your package, and again in someone else's package.

- This project is in active development and will likely be superseded by something built into Atom in the future. The purpose is simply to give package developers an easy way to ensure that other packages are installed.
