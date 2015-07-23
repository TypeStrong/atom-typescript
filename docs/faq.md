# FAQ

## I keep getting changes to tsconfig.json
This is probably because of us keeping `files` updated with the `filesGlob` option. The reason why we do this is because the official `tsconfig.json` spec does not support `filesGlob`. Therefore we keep `files` in sync with the `filesGlob` so that your team mates can use whatever editor they prefer (sublime text, visual studio etc.).

## I don't want atom-typescript compiling my js
Set `compileOnSave : false` in your tsconfig.json (https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#compileonsave).  Then you've got all the intellisense / refactoring goodness of atom-typescript but no generated JavaScript.  Why is this useful?  Well you might be using something else for your build such as [gulp-typescript](https://github.com/ivogabe/gulp-typescript) or [tsify](https://github.com/smrq/tsify).

## Which version of TypeScript does atom-typescript use?
It uses [ntypescript](https://github.com/TypeStrong/ntypescript) which is just a build of Microsoft/Master.  This means it's the latest and greatest of the TypeScript goodness.  There is a possibility that in the future it will move to TypeScript nightlies which is something that the TypeScript team is planning.

## Can I use a custom TypeScript compiler?
If it conforms the latest TypeScript services API then yes! Just set the path to `typescriptServices.js` in the package options.  

However, please note that the [version](https://github.com/TypeStrong/atom-typescript/blob/master/docs/tsconfig.md#version) in `tsconfig.json` does not indicate the compiler atom is using.  That's strictly an aide-mémoire - it's to remind you which version of the TypeScript this project is intended to work with.

## I prefer single (or double) quotes
You can set that in the package settings https://atom.io/docs/latest/using-atom-atom-packages#package-settings

## Atom Typescript is complaining about not finding files or other weird errors
You probably deleted them or added them or moved them around. We don't watch the file system as it is memory intensive and unreliable across operating systems. You can ask atom-typescript to do a rescan of your file system using the `sync` command (https://github.com/TypeStrong/atom-typescript#sync)

## Failed to Update
This can happen particularly on windows as it is not possible to delete a file if it is executing. Close all atom instances and run the following commands:

```
apm uninstall atom-typescript
apm install atom-typescript
```

## Failed to install
Follow the same steps as specified in failed to update.

## How can I contribute
see https://github.com/TypeStrong/atom-typescript/blob/master/CONTRIBUTING.md
