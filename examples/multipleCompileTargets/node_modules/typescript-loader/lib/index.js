/**
 * @copyright 2015, Andrey Popp <me@andreypopp.com>
 */
'use strict';

var Promise               = require('bluebird');
var loaderUtils           = require('loader-utils');
var path                  = require('path');
var TypeScriptWebpackHost = require('./TypeScriptWebpackHost');

function typescriptLoader(text) {
  if (this.cacheable) {
    this.cacheable();
  }
  var cb = this.async();
  var filename = this.resourcePath;
  var resolver = Promise.promisify(this.resolve);

  if (this._compiler.typeScriptWebpackHost === undefined) {
    var options = loaderUtils.parseQuery(this.query);
    if (options.typescriptCompiler) {
      var ts = require(options.typescriptCompiler);
    } else {
      var ts = require('typescript');
    }
    if (options.target) {
      options.target = parseOptionTarget(options.target, ts);
    }
    this._compiler.typeScriptWebpackHost = new TypeScriptWebpackHost(
      options,
      this._compiler.inputFileSystem,
      ts
    );
  }

  this._compiler.typeScriptWebpackHost.emit(resolver, filename, text)
    .then(function(output) {
      var result = findResultFor(output, filename);
      if (result.text === undefined) {
        throw new Error('no output found for ' + filename);
      }
      var sourceMap = JSON.parse(result.sourceMap);
      sourceMap.sourcesContent = [text];
      cb(null, result.text, sourceMap);
    }.bind(this))
    .catch(TypeScriptWebpackHost.TypeScriptCompilationError, function(err) {
      var errors = formatErrors(err.diagnostics);
      errors.forEach(this.emitError, this);
      cb(null, codegenErrorReport(errors));
    }.bind(this))
    .catch(cb);
}

function findResultFor(output, filename) {
  var text;
  var sourceMap;
  filename = path.normalize(filename);
  for (var i = 0; i < output.outputFiles.length; i++) {
    var o = output.outputFiles[i];
    var outputFileName = path.normalize(o.name);
    if (outputFileName.replace(/\.js$/, '.ts') === filename) {
      text = o.text;
    }
    if (outputFileName.replace(/\.js.map$/, '.ts') === filename) {
      sourceMap = o.text;
    }
  }
  return {
    text: text,
    sourceMap: sourceMap
  };
}

function parseOptionTarget(target, ts) {
  target = target.toLowerCase();
  switch (target) {
    case 'es3':
      return ts.ScriptTarget.ES3;
    case 'es5':
      return ts.ScriptTarget.ES5;
    case 'es6':
      return ts.ScriptTarget.ES6;
  }
}

function codegenErrorReport(errors) {
  return errors
    .map(function(error) {
      return 'console.error(' + JSON.stringify(error) + ');';
    })
    .join('\n');
}

function formatErrors(errors) {
  return errors.map(function(diagnostic) {
    var lineChar;
    if (diagnostic.file) {
      lineChar = diagnostic.file.getLineAndCharacterFromPosition(diagnostic.start);
    }
    return (
      (diagnostic.file ? diagnostic.file.filename + ' ' : '')
      + (lineChar ? formatLineChar(lineChar) + ' ': '')
      + diagnostic.messageText
    );
  });
}

function formatLineChar(lineChar) {
  return '(' + lineChar.line + ', ' + lineChar.character + ')';
}

module.exports = typescriptLoader;
