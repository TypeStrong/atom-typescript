# FAQ

## Syntax Highlighting is bad

Since v12, we're discontinuing our grammar in favor of
<https://github.com/atom/language-typescript>, which is
shipped with Atom.

Atom's TypeScript grammar is a little confusing, so please bear with the long-winded explaination below.

If you *are* using tree-sitter parsers (the default on latest Atom versions),
i.e. if 'Use Tree Sitter Parsers' option in Atom core settings is enabled,

![Use Tree Sitter Parsers option is enabled](https://user-images.githubusercontent.com/7275622/52045865-744b0700-2556-11e9-96bf-4367e90eeac5.png)

then grammar-related issues should go to <https://github.com/atom/language-typescript>
or <https://github.com/tree-sitter/tree-sitter-typescript>.

Otherwise, if you are *not* using tree-sitter parsers, the non-tree-sitter TypeScript
grammar is downstream from <https://github.com/Microsoft/TypeScript-TmLanguage>, and
general grammar issues should go there, and ones specific to Atom to
<https://github.com/atom/language-typescript>.

If you feel confused as to where you should create the issue, it's likely safe to default
to <https://github.com/atom/language-typescript>.

## I want to use package X for syntax highlighting instead of language-typescript, but Atom-TypeScript doesn't work

Long story short, Atom-TypeScript only activates when language-typescript
grammar is used. This is done mostly to save resources when you're not working
on TypeScript. The flipside is, when you want to use a different grammar
package, Atom-TypeScript won't know that.

Sadly, there is no way to easily configure this behaviour after package
installation, but there is a hack you could use.

Add the following to your init script (Edit → Init Script... or File → Init
Script... menu option -- the particular location depends on the platform for
some reason).

```coffee
#CHANGE THE PACKAGE NAME IN THE NEXT LINE
do (grammarPackageImUsing = "typescript-grammar-you-want-to-use") ->
  atom.packages.onDidTriggerActivationHook "#{grammarPackageImUsing}:grammar-used", ->
    atom.packages.triggerActivationHook 'language-typescript:grammar-used'
```

See [here](https://github.com/TypeStrong/atom-typescript/issues/1451#issuecomment-428151082) for more information.

## I want to use Atom-TypeScript with JavaScript, too

This is an experimental feature, so any issues you encounter, you are
encouraged to report.

First of all, go to Atom-TypeScript settings and enable the
'Enable Atom-TypeScript for JavaScript files'.

For Atom-TypeScript to auto-start when you open a JavaScript file, see the [previous question](#i-want-to-use-package-x-for-syntax-highlighting-instead-of-language-typescript-but-atom-typescript-doesnt-work). TL;DR if you're using the default `language-javascript`
grammar package for JavaScript syntax highlighting, add this to your Atom init
script:


```coffee
#CHANGE THE PACKAGE NAME IN THE NEXT LINE IF YOU'RE USING
#A DIFFERENT GRAMMAR PACKAGE
do (grammarPackageImUsing = "language-javascript") ->
  atom.packages.onDidTriggerActivationHook "#{grammarPackageImUsing}:grammar-used", ->
    atom.packages.triggerActivationHook 'language-typescript:grammar-used'
```

## Atom can't find modules/files that I just added

## Atom complains about errors that shouldn't happen with my tsconfig on new files

Tsserver can be lazy in reindexing project files for performance
reasons. You can manually tell it to refresh by running
`typescript:reload-projects` command

If that doesn't help, you can also forcibly restart running TsServer instances
with `typescript:restart-all-servers` command.

## Which version of TypeScript does atom-typescript use?

Your current version installed in your `node_modules`. This gets
determined once per open file so you might want to re-open your panes,
if you've updated TypeScript in your project.

## Atom TypeScript is complaining about not finding files or other weird errors

You probably deleted them or added them or moved them around. The
TypeScript compiler is decent about keeping track of moving files, but
sometimes things can go out of sync.

In that case, you can forcibly restart running TsServer instances
with `typescript:restart-all-servers` command.

If that doesn't help, resetting the editor using `Window: Reload` command
should work.

## Rename-refactor updates files in `node_modules`?!

This by design, since TypeScript doesn't really assign any special meaning to `node_modules`. You can explicitly forbid this by excluding `node_modules` from the project, f.ex. by adding `node_modules` to `exclude` option in `tsconfig.json`:

```json
{
  "exclude": [
    "node_modules"
  ]
}
```

## Failed to Update

This can happen particularly on windows ([relevant
issue](https://github.com/TypeStrong/atom-typescript/issues/195)) as it
is not possible to delete a file if it is executing. Close all atom
instances and run the following commands:

    apm uninstall atom-typescript
    apm install atom-typescript

## Failed to install

Follow the same steps as specified in [failed to update](#failed-to-update).

## How can I contribute

see
<https://github.com/TypeStrong/atom-typescript/blob/master/CONTRIBUTING.md>
