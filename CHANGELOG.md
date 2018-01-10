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
