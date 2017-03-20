# FAQ

## Syntax Highlighting is bad

For grammar issues go here : https://github.com/Microsoft/TypeScript-TmLanguage/issues and link back to us if you want us to pull from upstream 🌹.

More on how our grammar is managed : https://github.com/TypeStrong/atom-typescript/blob/master/docs/grammar.md

## Which version of TypeScript does atom-typescript use?
Your current version installed in your `node_modules`. This gets determined once per open file so you might want to re-open your panes, if you've updated Typescript in your project.

## Atom Typescript is complaining about not finding files or other weird errors
You probably deleted them or added them or moved them around. The Typescript compiler is decent about keeping track of moving files, but sometimes things can go out of sync and in that case it's best to simply reset the editor using `Window: Reload` command.

## Failed to Update
This can happen particularly on windows ([relevant issue](https://github.com/TypeStrong/atom-typescript/issues/195)) as it is not possible to delete a file if it is executing. Close all atom instances and run the following commands:

```
apm uninstall atom-typescript
apm install atom-typescript
```

## Failed to install
Follow the same steps as specified in failed to update.

## How can I contribute
see https://github.com/TypeStrong/atom-typescript/blob/master/CONTRIBUTING.md
