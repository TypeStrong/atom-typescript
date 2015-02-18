/**
 * @copyright 2015, Andrey Popp <me@andreypopp.com>
 */
'use strict';

var fs            = require('fs');
var util          = require('util');
var path          = require('path');
var objectAssign  = require('object-assign');
var Promise       = require('bluebird');

function prepareStaticSource(moduleId) {
  var filename = require.resolve(moduleId);
  var text = fs.readFileSync(filename, 'utf8');
  return {filename: filename, text: text};
}

var RUNTIME = prepareStaticSource('./webpack-runtime.d.ts');
var LIB     = prepareStaticSource('typescript/bin/lib.d.ts');

function TypeScriptWebpackHost(options, fs, ts) {
  ts = ts || require('typescript');
  this.ts = ts;
  this.options = {};
  objectAssign(this.options, {
    target: this.ts.ScriptTarget.ES5,
    module: this.ts.ModuleKind.CommonJS,
    sourceMap: true,
    verbose: false
  });
  objectAssign(this.options, options);
  this._fs = fs;
  this._files = {};
  this._services = this.ts.createLanguageService(this, this.ts.createDocumentRegistry());
  this._runtimeRead = null;

  this._addFile(RUNTIME.filename, RUNTIME.text);
  this._addFile(LIB.filename, LIB.text);
}

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getScriptFileNames = function getScriptFileNames() {
  return Object.keys(this._files);
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getScriptVersion = function getScriptVersion(filename) {
  return this._files[filename] && this._files[filename].version.toString();
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getScriptSnapshot = function getScriptSnapshot(filename) {
  var file = this._files[filename];
  return {
    getText: function(start, end) {
      return file.text.substring(start, end);
    },
    getLength: function() {
      return file.text.length;
    },
    getLineStartPositions: function() {
      return [];
    },
    getChangeRange: function(oldSnapshot) {
      return undefined;
    }
  };
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getCurrentDirectory = function getCurrentDirectory() {
  return process.cwd();
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getScriptIsOpen = function getScriptIsOpen() {
  return true;
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getCompilationSettings = function getCompilationSettings() {
  return this.options;
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.getDefaultLibFilename = function getDefaultLibFilename(options) {
  return LIB.filename;
};

/**
 * Implementation of TypeScript Language Services Host interface.
 */
TypeScriptWebpackHost.prototype.log = function log(message) {
  if (this.options.verbose) {
    console.log(message);
  }
};

/**
 * Return an array of import declarations found in source file.
 */
TypeScriptWebpackHost.prototype._findImportDeclarations = function _findImportDeclarations(filename) {
  var node = this._services.getSourceFile(filename);
  var result = [];
  var visit = function(node) {
    if (node.kind === this.ts.SyntaxKind.ImportDeclaration) {
      // we need this check to ensure that we have an external import
      if (node.moduleReference.hasOwnProperty("expression")) {
        result.push(node.moduleReference.expression.text);
      }
    } else if (node.kind === this.ts.SyntaxKind.SourceFile) {
      result = result.concat(node.referencedFiles.map(function(f) {
        return path.resolve(path.dirname(node.filename), f.filename);
      }));
    }
    this.ts.forEachChild(node, visit);
  }.bind(this);
  visit(node);
  return result;
};

TypeScriptWebpackHost.prototype._addFile = function _addFile(filename, text) {
  var prevFile = this._files[filename];
  var version = 0;
  if (prevFile) {
    version = prevFile.version;
    if (prevFile.text !== text) {
      version = version + 1;
    }
  }
  this._files[filename] = {text: text, version: version};
};

TypeScriptWebpackHost.prototype._readFile = function _readFile(filename) {
  var readFile = Promise.promisify(this._fs.readFile.bind(this._fs));
  return readFile(filename).then(function(buf) {
    return buf.toString('utf8');
  });
};

TypeScriptWebpackHost.prototype._readFileAndAdd = function _readFileAndAdd(filename) {
  return this._readFile(filename).then(this._addFile.bind(this, filename));
};

TypeScriptWebpackHost.prototype._resolve = function _resolve(resolver, filename, dep) {
  return resolver(path.dirname(filename), dep)
    .error(function(error) {
      if (path.extname(filename).length) {
        return resolver(path.dirname(filename), dep + ".d.ts")
      } else {
        throw error;
      }
    })
    .error(function(error) {
      if (path.extname(filename).length) {
        return resolver(path.dirname(filename), dep + ".ts")
      } else {
        throw error;
      }
    })
}

TypeScriptWebpackHost.prototype._addDependencies = function(resolver, filename) {
  var dependencies = this._findImportDeclarations(filename).map(function(dep) {
    return this._resolve(resolver, filename, dep).then(function(filename) {
      var alreadyExists = this._files[filename];
      var added = this._readFileAndAdd(filename);
      // This is d.ts which doesn't go through typescript-loader separately so
      // we should take care of it by analyzing its dependencies here.
      if (/\.d.ts$/.exec(filename) && !alreadyExists) {
        added = added.then(function() {
          return this._addDependencies(resolver, filename);
        }.bind(this));
      }
      return added;
    }.bind(this));
  }.bind(this));
  return Promise.all(dependencies);
}

/**
 * Emit compilation result for a specified filename.
 */
TypeScriptWebpackHost.prototype.emit = function emit(resolver, filename, text) {
  this._addFile(filename, text);

  // Check if we need to compiler Webpack runtime definitions.
  if (!this._runtimeRead) {
    this._services.getEmitOutput(RUNTIME.filename);
    this._runtimeRead = true;
  }

  return this._addDependencies(resolver, filename).then(function() {
    var output = this._services.getEmitOutput(filename);
    if (output.emitOutputStatus === this.ts.EmitReturnStatus.Succeeded) {
      return output;
    } else {
      var diagnostics = this._services
        .getCompilerOptionsDiagnostics()
        .concat(this._services.getSyntacticDiagnostics(filename))
        .concat(this._services.getSemanticDiagnostics(filename));
      throw new TypeScriptCompilationError(diagnostics);
    }
  }.bind(this));
};

function TypeScriptCompilationError(diagnostics) {
  this.diagnostics = diagnostics;
}
util.inherits(TypeScriptCompilationError, Error);

module.exports = TypeScriptWebpackHost;
module.exports.TypeScriptCompilationError = TypeScriptCompilationError;
