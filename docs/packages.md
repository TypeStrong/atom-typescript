# Our package recommendations

### [Project Manager](https://atom.io/packages/project-manager)

Atom works on the basis of "folder" based project. It remembers the
settings / state for when you open a project.

This package allows you to quickly open a specific folder. You can even
store config options specific to a project e.g. at my work we don't
remove whitespace or add a new line to allow people to use whatever
editor and not get insignificant diffs on legacy code:

``` cson
'work':
  'title': 'work'
  'paths': [
    'C:\\dev\\work'
  ],
  'settings':
    'whitespace.removeTrailingWhitespace': false
    'whitespace.ensureSingleTrailingNewline': false
```

It also allows you to configure options of `atom-typescript` on a per
project basis e.g.

``` cson
'work':
  'title': 'work'
  'paths': [
    'C:\\dev\\work'
  ],
  'settings':
    'atom-typescript.debugAtomTs': false
```

### [Jumpy](https://atom.io/packages/jumpy)

Saves a lot of wrist pain.

### [last-cursor-position](https://atom.io/packages/last-cursor-position)

Like visual studio go back to previous location. Really useful when you
navigate to stuff and want to go back to where you were working.

### [Find selection](https://atom.io/packages/find-selection)

Who has time to bring up the find and replace dialog for a quick find
word?

### [docblockr](https://atom.io/packages/docblockr)

For easier jsdocing
