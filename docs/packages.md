# Our package recommendations

## Critical

### autocomplete-plus
We will install this for you to give a good autocomplete experience

### linter
We will install this for you to give a good error highlight experience

## Misc
We don't install these but highly recommend them

### Manage your projects
https://github.com/danielbrodin/atom-project-manager
Atom works on the basis of "folder" based project. It remembers the settings / state for when you open a project. 

This package allows you to quickly open a specific folder. You can even store config options specific to a project e.g. at my work we don't remove whitespace or add a new line to allow people to use whatever editor and not get insignificant diffs on legacy code:

```cson
'work':
  'title': 'work'
  'paths': [
    'C:\\dev\\work'
  ],
  'settings':
    'whitespace.removeTrailingWhitespace': false
    'whitespace.ensureSingleTrailingNewline': false
```

### Jumpy
https://atom.io/packages/jumpy saves a lot of wrist pain.