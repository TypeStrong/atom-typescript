# glob-expand

A (sync) glob / minimatch / RegExp call using [gruntjs](https://github.com/gruntjs/grunt)'s `file.expand`.

It has only a minimum of dependencies (glob & lodash).

Its almost a copy/paste of 2 functions from Gruntjs's v0.4.1 [grunt/file.js](https://github.com/gruntjs/grunt/blob/master/lib/grunt/file.js)

Additionally you can use [minimatch](http://github.com/isaacs/minimatch/) `String`s or `RegExp`s, either as an Array or as arguments.
*

## Install:

`npm install glob-expand`

## Examples:
```coffeescript
	expand = require 'glob-expand'

	# may the original node-glob be with you (should you need it):
	glob = expand.glob

	expand {filter: 'isFile', cwd: '../'}, ['**/*.*', '!exclude/these/**/*.*']
	# returns all files in cwd ['file1', 'file2',...] but excluding
	# those under directory 'exclude/these'

	# These are the same
	expand {cwd: '../..'}, ['**/*.*', '!node_modules/**/*.*']
	expand {cwd: '../..'}, '**/*.*', '!node_modules/**/*.*'

	# These are the same too:
	expand {}, ['**/*.*', '!**/*.js']
	expand {}, '**/*.*', '!**/*.js'
	expand ['**/*.*', '!**/*.js']
	expand '**/*.*', '!**/*.js'

	# Using Regular Expressions:
	expand '**/*.js', /.*\.(coffee\.md|litcoffee|coffee)$/i, '!DRAFT*.*'
	# -> returns all `.js`, `.coffee`, `.coffee.md` & `.litcoffee` files,
	#    excluding those starting with 'DRAFT'

```

See [gruntjs files configuration](http://gruntjs.com/configuring-tasks#files)
and [node-glob](https://github.com/isaacs/node-glob) for more options.

Sorry no tests, I assumed gruntjs's tests are sufficient ;-)