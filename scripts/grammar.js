var cson = require('cson')
var yaml = require('js-yaml')
var fs = require('mz/fs')
var join = require('path').join
var request = require('popsicle').request

var atomPatterns = [
  {
    comment: 'Match debugger statement',
    match: '\\b(debugger)\\b',
    captures: {
      '1': {
        name: 'keyword.debugger.ts'
      }
    }
  },
  {
    comment: 'Match full triple slash reference comments',
    match: '(\\/\\/\\/\\s*<reference\\s*path\\s*=)(.*)(\\/>)',
    captures: {
      '1': {
        name: 'keyword.other.ts'
      },
      '2': {
        name: 'reference.path.string.quoted'
      },
      '3': {
        name: 'keyword.other.ts'
      }
    }
  },
  {
    comment: 'Match <amd-dependency',
    match: '(\\/\\/\\/\\s*<amd-dependency\\s*path\\s*=)(.*)(\\/>)',
    captures: {
      '1': {
        name: 'keyword.other.ts'
      },
      '2': {
        name: 'amd.path.string.quoted'
      },
      '3': {
        name: 'keyword.other.ts'
      }
    }
  },
  {
    comment: 'Match <amd-module',
    match: '(\\/\\/\\/\\s*<amd-module\\s*name\\s*=)(.*)(\\/>)',
    captures: {
      '1': {
        name: 'keyword.other.ts'
      },
      '2': {
        name: 'amd.path.string.quoted'
      },
      '3': {
        name: 'keyword.other.ts'
      }
    }
  },
  {
    comment: 'Match import = require',
    match: '\\b(import)\\s+([\\p{L}\\p{Nl}$_][\\p{L}\\p{Nl}$\\p{Mn}\\p{Mc}\\p{Nd}\\p{Pc}\\x{200C}\\x{200D}]*)\\s*=\\s*(require)\\s*\\((.*)\\)',
    captures: {
      '1': {
        name: 'keyword.other.ts'
      },
      '2': {
        name: 'variable.type.ts'
      },
      '3': {
        name: 'keyword.other.ts'
      },
      '4': {
        name: 'require.path.string.quoted'
      }
    }
  },
  {
    comment: 'Match ES6 "import from" syntax',
    match: '\\b(import)\\b.*\\b(from)\\b\\s+(([\'"]).*\\4)',
    captures: {
      '1': {
        name: 'keyword.other.ts'
      },
      '2': {
        name: 'keyword.other.ts'
      },
      '3': {
        name: 'es6import.path.string.quoted'
      }
    }
  }
]

Promise.all([
  request('https://raw.githubusercontent.com/Microsoft/TypeScript-TmLanguage/master/TypeScript.YAML-tmLanguage'),
  request('https://raw.githubusercontent.com/Microsoft/TypeScript-TmLanguage/master/TypeScriptReact.YAML-tmLanguage')
])
  .then(function (result) {
    var name
    var ts = yaml.safeLoad(result[0].body)
    var tsx = yaml.safeLoad(result[1].body)

    for(var key in ts.repository) {
      name = ts.repository[key].name
      if(name && name.indexOf('string.quoted') === -1) {
        ts.repository[key].name = name.replace('string', 'string.quoted')
      }
    }

    for(var key in tsx.repository) {
      name = tsx.repository[key].name
      if(name && name.indexOf('string.quoted') === -1) {
        tsx.repository[key].name = name.replace('string', 'string.quoted')
      }
    }

    atomPatterns.forEach(function (pattern) {
      ts.repository.expression.patterns.unshift(pattern)
      tsx.repository.expression.patterns.unshift(pattern)
    })

    return Promise.all([
      fs.writeFile(join(__dirname, '../grammars/ts.cson'), cson.stringify(ts, null, '  ')),
      fs.writeFile(join(__dirname, '../grammars/tsx.cson'), cson.stringify(tsx, null, '  '))
    ])
  })
  .catch(function (err) {
    console.error(err.stack)
    process.exit(1)
  })
