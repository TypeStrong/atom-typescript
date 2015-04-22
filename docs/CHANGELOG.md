# Breaking Changes

We only plan strictly document the breaking changes. The rest is optional.

# v1
* `format` -> `formatCodeOptions` https://github.com/TypeStrong/atom-typescript/issues/178
* `compileOnSave` is now a tsconfig option : https://github.com/TypeStrong/atom-typescript/issues/187

# v2
* New default shortcuts for `build` : `F6` an `goto definition`: `F12`. Because I don't want to mess with your atom defaults and a major use base is VS users. [Link #145](https://github.com/TypeStrong/atom-typescript/issues/145)

# v3
* We will now resolve a parent `package.json` for you *automatically* so that its *one less thing you need to configure*. :rose:

# Planned
[](* No breaking changes yet.)
* Remove `dts-generator` support as TypeScript will have a better module sharing story out of the box.
