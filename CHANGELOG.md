## 13.4.3

-   Add missing files

    This fixes a packaging bug in 13.4.1

## 13.4.1

-   Rework replacement prefix heuristic in autocompletion

    This hopefully fixes an array of relatively infrequent, but annoying
    bugs when confirming an autocompletion suggestion would remove some part
    of the preceding code. See [#1528](https://github.com/TypeStrong/atom-typescript/issues/1528) for an example.

## 13.4.0

### New features

-   "Scrollable" builtin signature help

    Now builtin signature help only displays one signature, and signatures
    are "scrollable" using `typescript:typescript:signature-help-next` and `typescript:signature-help-prev` commands, bound to `Page Down` and `Page Up` by default.

-   Tooltips now include JSDoc tag information (i.e. `@param`, `@return`, etc) (via Pull request #1523 from Jérémy Flusin)

    Notice this changes some CSS used in tooltips. Builtin tooltips are particularly affected. If you're using custom CSS, we're sorry for the inconvenience.

-   Add "<" as signature help trigger character

    This brings signature help more in-line with how tsserver expects things to work. The visible result is that signature help is displayed for React components in JSX.

-   Bundle TypeScript 3.7

### Fixes

-   Fix #1522 (subscription disposal race condition)
-   Fix #1509 (catch errors from pixelPositionForBufferPosition calls to dying editor views)
-   Fix #1503 (tree-sitter compatibility for "find references" views)
-   Grammar and wording fixes in docs (Beth McIntosh)

### Maintenance

-   Use className in JSX instead of class
-   Force LF newlines in generated files
-   Bump dependencies

## 13.3.0

-   Bump atom-highlight version
-   Rename File command

## 13.2.0

-   Allow autocomplete in strings
-   Use onDidChangeText instead of onDidStopChanging for tracking buffer modification
-   Bump dependencies

## 13.1.0

-   Disable instance-per-tsconfig by default; make it configurable

    Back in v12.7.0, a change was introduced to spawn a separate tsserver
    instance per `tsconfig.json` file. This effectively made project
    assignment for source files referenced in several projects
    deterministic. However, this same change can prevent external
    declaration files (like ones in `node_modules/@types`) from being
    reloaded by tsserver even when they are opened in Atom, which is by far
    a more common thing to want than deterministic project assignment.

    So, the instance-per-tsconfig code is now disabled by default. You can
    enable it in the Atom-TypeScript settings. The option is called
    `tsserverInstancePerTsconfig` and is titled "Spawn separate tsserver
    instance for each tsconfig.json" in the settings GUI.

## 13.0.2

-   Auto-add json extension to config file path if it's missing

## 13.0.1

-   Recursively load extended config

## 13.0.0

### Breaking changes

**TL;DR: TypeScript prior to v1.5.3 is no longer supported.**

-   Use documentHighlights instead of occurrences
-   Use TypeScript API for parsing `tsconfig.json`

    Notice: currently, the bundled TypeScript implementation is used. This
    should work fine in most cases, however, some edge cases might produce
    confusing behaviour (e.g. Atom-TypeScript might parse `tsconfig.json`, but
    `tsc` might not -- or vice versa). Please report any issues related to
    `tsconfig.json` parsing.

-   Remove dependency on `tsconfig` npm module

    This module was used to parse `tsconfig.json` more or less "like
    TypeScript". The module is essentially unsupported at this point. There is
    little reason to try to use it nowadays.

This essentially makes it so TypeScript prior to v1.5.3 is no longer
supported. TypeScript v1.5.3 has been released in July 2015, so I feel
that it's old enough to be nearly ubiquitous. If you need to work with TypeScript prior to v1.5.3, please use older release of Atom-TypeScript.

On the plus side, inherited `tsconfig.json` should work as expected now.

### Changes

-   Crashed server is restarted on demand only

    In v12.7.0, a feature was added that would auto-restart tsserver if
    it crashed, but it did contain a guard against crash-loop (to avoid
    hogging system resources). This decision evidently lead to some
    confusion, so now the crashed tsserver is only restarted on demand, i.e.
    if there is a need for a running instance. This should all happen
    in background. On the upside, now there's no limit to how much tsserver
    can crash before it's no longer auto-restarted, so it generally should
    work more consistently.

### General fixes

-   Dispose of Linter in errorPusher properly
-   Inherited `tsconfig.json` should work as expected now due to switching
    to TypeScript-supplied config parser.

### Maintenance

-   Update bundled TypeScript to v3.2.2
-   Fix typo in `package.json` (Wes Moberly)
-   Add proper LICENSE text

    Atom-TypeScript has always been licensed under the MIT license, but
    the license text was missing, instead the license file only contained the
    word "MIT". This has been fixed.

-   Remove bogus await
-   Clean up errorPusher code
-   Remove outdated comments
-   Removed dangling grammar settings
-   Add support for new completionInfo command, avoid using deprecated completions

    Since v3.0.0, TypeScript deprecated old completion commands, and instead
    implemented new ones. Since we obviously want to support TypeScript
    prior to v3.0.0 for the time being, the new interface is preferred when
    available, but Atom-TypeScript will fall back to the old one on TypeScript
    versions prior to v3.0.0.

## 12.7.3

-   Clean up tooltip code; Do not try to show tooltips on destroyed editors

## 12.7.2

-   Auto-restart tsserver syncronously to avoid race conditions

## 12.7.1

-   Catch and properly report tsconfig parse errors

## 12.7.0

### Changes

-   Bundled TypeScript version updated to 3.1.6

-   Made config-file selection deterministic

    Now a separate tsserver instance is started for each `tsconfig.json`.
    This has a result of the closest `tsconfig.json` (wrt directory
    hierarchy) always being selected for the typescript file. This should make
    cases where the same file is be used in multiple TypeScript sub-projects
    less confusing to deal with.

-   Atom-IDE interfaces are preferred to builtin ones if available. This
    includes tooltips, occurrence markers, etc. Most of these changes can
    be reverted by choosing appropriate preferences in the Atom-TypeScript
    settings.

### New features

-   Made tooltip position configurable

-   Experimental support for `allowJS` and `checkJS`. This needs to be
    explicitly enabled in the settings

-   Added "signature help", i.e. function arguments tooltip

-   Added the ability to restart tsserver; it will also be auto-restarted
    on crashes, if those don't happen too frequently

-   Added support for more atom-ide interfaces, namely:

    -   Find References
    -   Definitions
    -   Outline
    -   Code Highlight (occurrence highlight)
    -   Busy Signal

    Built-in options are still available via settings.

-   Implemented intentions highlight interface

### Fixes

-   Fixed yet another applyEdits operation ordering bug
-   Don't try to compile on save if compileOnSave is false\/unset in
    `tsconfig.json`
-   Fixed a couple status panel display bugs (status\/progress)
-   Added nuclide to list of packages providing UI components (so that there
    is no prompt to install atom-ide-ui when nuclide is already present)
-   Fix tsconfig path display bug. The display is deferred until the config
    path is resolved in the first place.
-   A lot of fixes wrt floating promises.
-   Some synchronization fixes

### Maintenance

-   Use newer Atom API for text changes
-   Simplify change command invocation
-   Update dependencies
-   Moved built status update to TSBuffer (avoid multiple updates); ensure no change event interleaving
-   Add a rule against floating Disposables
-   Wait a bit longer on checkAllFiles
-   Added no-unbound-method rule
-   Clean autoCompleteProvider code somewhat
-   Do not expose withTypescriptBuffer; don't create temporary ts buffers
-   Simplify client code a bit
-   Removed client accessors from TypeScriptBuffer
-   Tweak some typings (formatting, etc)
-   Enable definition checking; fix definitions
-   Defer requiring SemanticView until needed
-   Major rewrite of TypescriptEditorPane
-   Split commands\/clearErrors to separate files
-   Handle promises in occurrence controller appropriately; clear saved markers
-   Move occurrence handler into a pluggable module
-   Shorten buffer flush code in autocompleteProvider
-   Enabled ordered-imports rule
-   Treat TSLint warnings as errors for the purposes of CI
-   Switch to typescript-tslint-plugin
-   Refactor statusbar; throttle pending updates to reduce statusbar jitter
-   Tweak builtin tooltips
-   Refactor tooltips
-   Isolate tsclient code a little better
-   Enabled no-floating-promises rule
-   Refactor TypescriptServiceClient.on
-   Fix typescript server typing

## 12.6.3

-   Ensure text edits are always applied in reverse location order

    Fixes rename-refactor on TypeScript 3.0

-   Fix spelling of “TypeScript” (Jakob Krigovsky)

## 12.6.2

-   Normalize file path when searching for existing typescript buffer

## 12.6.1

-   Fix [#1437](https://github.com/TypeStrong/atom-typescript/issues/1437)

## 12.6.0

### New features

-   Added `typescript:organize-imports` command (needs recent enough TypeScript)

-   Added option for suppressing all diagnostics

-   Added an option to ignore unused\* suggestion diagnostics specifically

    See [#1433](https://github.com/TypeStrong/atom-typescript/issues/1433)
    for context.

    Long story short, TypeScript 2.9 will report unused locals/parameters/etc
    regardless of tsconfig settings, just with different severity. This option
    lets you disable those lower-serverity diagnostics specifically.

### Changes

-   Updated dependencies. In particular, bundled TypeScript version bumped to
    v2.9.2

### Maintenance

-   Refactored commands code
-   Added order to settings

## 12.5.3

-   Configurable tooltip delay
-   Removed unneeded tooltip delay

## 12.5.2

-   Allow refactors for empty selection
-   Clean-up client code a bit

## 12.5.1

### Fixes

-   Don't ignore insertText autocompletion suggestions
-   Minor bugfixes in initializeConfig command

### Maintenance

-   Enabled no-shadowed-variable tslint diagnostic
-   Enabled no-unsafe-any tslint diagnostic

## 12.5.0

-   Fix #1423 (unhandled error when tsserver is terminated)
-   Bundle TypeScript 2.8
-   Add tslint-language-service to set-up.
-   Clean up client code
-   Add "suggestion diagnostics"

## 12.4.1

-   Fix autocomplete and codefix for tree-sitter

## 12.4.0

-   Search all panes when opening files (fixes #898)
-   Internal code optimizations
-   Add applyEdits function that also flushes changes to tsserver
-   Add `typescript:refactor-selection` command to show applicable refactors for a selection (Daniel Contreras)
-   Update to TypeScript 2.7
-   Normalize path in ErrorPusher.getErrorsAt
-   Implement showExpressionType cancellation
-   strict-boolean-expressions
-   Fix spec runner

## 12.3.8

-   Accept tree-sitter grammar

## 12.3.7

-   Avoid duplicate `open` command (which confuses tsserver)
-   Normalize errorPusher path on storage

## 12.3.6

-   Fix #1413

## 12.3.5

-   Fix semantic view display on initial creation

## 12.3.4

-   Track exprTypeTooltip globally

    This should help with tooltips getting "stuck" occasionally.

## 12.3.3

-   [Bufgix] invalid comparison

## 12.3.2

-   Fix TypeScript dependency

## 12.3.1

-   Use external highlighter in tsView instead of MiniEditor
    -   Should be a little bit more efficient and avoids flickering due
        to asynchronous tokenization
-   Remove \$ from find-references line number
-   Do not update selectView after resolution
    -   Avoids unexpected behavior when selectView is canceled before it
        loads
-   Fix symbols-view offset
    -   Going to an item from symbols-view was offset by 1 character to
        the right
-   Updates for Atom 1.24

## 12.3.0

-   Added an alternative to symbols-view (by russa)
    -   For file symbols, the same engine is used as for outline view
    -   For project symbols, `nav-to` tsserver command is used. It
        requires at least one symbol to search for.
-   Improvements to `typescript:return-from-declaration`
    -   All navigation commands (`find-references`, `go-to-declaration`,
        etc) save current editor position
    -   Added new command `typescript:show-editor-position-history` to
        show backlog of editor positions, that `return-from-declaration`
        will go back to
    -   Editor position history is persisted across Atom restarts (per
        project). To avoid bloating, total number of history items is
        limited to 100
-   Added `typescript:reload-projects` command
    -   Useful when tsserver isn't aware of new or removed files --
        previously this required Atom restart
-   Matched substring is highlighted in all select views (like Atom's
    bundled symbols-view)
-   Streamlined TypeScript file detection
    -   TypeScript file extension is assumed to be one of ".ts", ".tst",
        ".tsx"
    -   If it's open in editor, grammar is assumed to be one of
        "source.ts", "source.tsx"
    -   A file has to be saved (i.e. have a file path)
-   Many internal improvements
    -   Completely reworked tooltip management
    -   Most commands are bound to text-editor instead of the workspace
    -   Object lifetime management improvements
    -   Removed duplicate and obsolete code
-   Fix README link to CHANGELOG (by Fedde Schaeffer)

## 12.2.0

-   Merge pull request \#1402 "Center cursor after open in
    goToDeclaration" by Kai Curtis
-   Merge pull request \#1280 "Re-adding semantic view" by russaa

## 12.1.2

-   Use BufferedNodeProcess to spawn tsc (fixes 'init tsconfig' on
    Windows)

## 12.1.1

-   Fix occurrence markers

## 12.1.0

-   Show build error when "Emit failed" is clicked
-   Re-add progress bar for emit
-   Hide successful build status report "Emit success" after a
    configurable delay
-   Use [Etch](https://github.com/atom/etch) as the GUI framework
    instead of deprecated space-pen or direct DOM manipulation
-   Switch to ES2017 target
-   Update dependencies
-   Add `typescript:initialize-config` command
    ([\#1248](https://github.com/TypeStrong/atom-typescript/issues/1248))
    (by Paul Ermolin)

    Command is `typescript:initialize-config`, and it uses `tsc init`
    under the hood. Note that this is also an activation command,
    meaning you can use it without opening a TypeScript file first.
    However, it determines the project path from currently-active text
    editor -- if there aren't any text editors open, command doesn't do
    anything.

    No keybinding is assigned by default, since this is not a command
    one would use often.

-   Documentation updates
-   Remove obsolete `filesGlob` snippet
-   Don't use deprecated `.editor` class in grammar style
-   Add locale setting to control TypeScript's message locale
    ([\#1371](https://github.com/TypeStrong/atom-typescript/issues/1371))

## 12.0.0

-   **Switch to Atom's TypeScript grammar** (potentially
    compatibility-breaking)

    We're discontinuing our own grammar in favor of language-typescript,
    which is bundled with Atom. **Please make sure that
    language-typescript package is activated, we have no way of
    activating it for you.**

-   Cache constructed TypescriptBuffers by TextBuffers.

    Hopefully this helps with issues like \#1300 and \#1332

-   Show tooltip command

    Closes \#957. Adds `typescript:show-tooltip` command to show type
    tooltip at current text cursor position.

-   Configurable autocomplete-plus `suggestionPriority`

    Closes \#1185. Exactly what it says on the tin, allows configuring
    priority of TypeScript's autocompletion suggestions.

-   Moved config schema to package.json

    This should speed up Atom start-up times, since it doesn't need to
    load package source until needed.

-   Change target to ES7/2016

    Atom supports full ES7 now, so no reason not to, really.

-   Support for atom-ide-ui

    No installation prompt if atom-ide-ui or linter is detected, support
    for atom-ide-ui code fixes.

-   Do not show progress bar for emit

    This never worked properly, and a progress bar would get stuck in
    the panel after emit, so this is treated as a bug and removed for
    now.

-   Updated installation instructions in README

## 11.0.10

-   Hide Remove redundant autocomplete label text
-   Update the grammar to fix several highlighting issues
-   Add a framework for writing specs

## 11.0.9

-   Handle multiple directories in NODE\_PATH
-   TypeScript 2.5: exclude tsconfig.json from project files on emit

## 11.0.8

-   Speed up autocomplete and fix a disposable leak

# Older changes

Please note only breaking changes are logged beyond this point. You can
use GitHub's branch/tag comparison tool to get a full changeset, for
example,
<https://github.com/TypeStrong/atom-typescript/compare/v7.0.0...v8.0.0>
shows all changes since v7.0.0 until v8.0.0

## v11.0.0

-   Major rewrite using `tsserver` API for the best compatibility with
    the current versions of Typescript.

## v7.0.0

-   Removed the (already ignored in any significant way) `version`
    option from tsconfig.
    [More](https://github.com/TypeStrong/atom-typescript/issues/617)

## v6.0.0

-   Bring back `dts-generator` as using the other mechanism has a few
    gotchas that might surprise new users. We will remove this feature
    once <https://github.com/Microsoft/TypeScript/issues/2338> is
    officially supported.

## v5.0.0

-   We no longer *automatically* create a `tsconfig.json`. However we
    provide a *command* "TypeScript: Create tsconfig.json project file".

## v4.8.0

-   Feature: Added ReactJS / `.tsx` support

## v4

-   Removed `dts-generator` support. Reason is that it pollutes the
    global namespace and is no longer the recommended way for sharing
    TypeScript code. See
    <https://github.com/Microsoft/TypeScript/issues/2338> for the way
    forward.

## v3

-   We will now resolve a parent `package.json` for you *automatically*
    so that its *one less thing you need to configure*. :rose:

## v2

-   New default shortcuts for `build` : `F6` an `goto definition`:
    `F12`. Because I don't want to mess with your atom defaults and a
    major use base is VS users. [Link
    \#145](https://github.com/TypeStrong/atom-typescript/issues/145)

## v1

-   `format` → `formatCodeOptions`
    https://github.com/TypeStrong/atom-typescript/issues/178
-   `compileOnSave` is now a tsconfig option :
    https://github.com/TypeStrong/atom-typescript/issues/187

## 0.x

-   Initial releases
