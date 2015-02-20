(function() {
  var CoffeeScript, CoffeeScriptVersion, SourceMapConsumer, cachePath, compileSourceMap, convertLine, convertStackTrace, crypto, fs, getCachePath, getCachedSourceMap, getSourceMapPosition, path, writeSourceMapToCache;

  crypto = require('crypto');

  fs = require('fs-plus');

  path = require('path');

  CoffeeScriptVersion = null;

  CoffeeScript = null;

  SourceMapConsumer = null;

  cachePath = null;

  getCachePath = function(code) {
    var digest;
    if (!cachePath) {
      return;
    }
    digest = crypto.createHash('sha1').update(code, 'utf8').digest('hex');
    if (CoffeeScriptVersion == null) {
      CoffeeScriptVersion = require('coffee-script/package.json').version;
    }
    return path.join(cachePath, CoffeeScriptVersion, "" + digest + ".json");
  };

  getCachedSourceMap = function(codeCachePath) {
    if (fs.isFileSync(codeCachePath)) {
      try {
        return fs.readFileSync(codeCachePath, 'utf8');
      } catch (_error) {}
    }
  };

  writeSourceMapToCache = function(codeCachePath, sourceMap) {
    if (codeCachePath) {
      try {
        fs.writeFileSync(codeCachePath, sourceMap);
      } catch (_error) {}
    }
  };

  compileSourceMap = function(code, filePath, codeCachePath) {
    var v3SourceMap;
    if (CoffeeScript == null) {
      CoffeeScript = require('coffee-script');
    }
    v3SourceMap = CoffeeScript.compile(code, {
      sourceMap: true,
      filename: filePath
    }).v3SourceMap;
    writeSourceMapToCache(codeCachePath, v3SourceMap);
    return v3SourceMap;
  };

  getSourceMapPosition = function(sourceMapContents, line, column) {
    var sourceMap;
    if (SourceMapConsumer == null) {
      SourceMapConsumer = require('source-map').SourceMapConsumer;
    }
    sourceMap = new SourceMapConsumer(sourceMapContents);
    return sourceMap.originalPositionFor({
      line: line,
      column: column
    });
  };

  convertLine = function(filePath, line, column, sourceMaps) {
    var code, codeCachePath, position, source, sourceMapContents, sourceMapPath;
    if (sourceMaps == null) {
      sourceMaps = {};
    }
    try {
      if (!(sourceMapContents = sourceMaps[filePath])) {
        if (path.extname(filePath) === '.js') {
          sourceMapPath = "" + filePath + ".map";
          sourceMapContents = fs.readFileSync(sourceMapPath, 'utf8');
        } else {
          code = fs.readFileSync(filePath, 'utf8');
          codeCachePath = getCachePath(code);
          sourceMapContents = getCachedSourceMap(codeCachePath);
          if (sourceMapContents == null) {
            sourceMapContents = compileSourceMap(code, filePath, codeCachePath);
          }
        }
      }
      if (sourceMapContents) {
        sourceMaps[filePath] = sourceMapContents;
        position = getSourceMapPosition(sourceMapContents, line, column);
        if ((position.line != null) && (position.column != null)) {
          if (position.source && position.source !== '.') {
            source = path.resolve(filePath, '..', position.source);
          } else {
            source = filePath;
          }
          return {
            line: position.line,
            column: position.column,
            source: source
          };
        }
      }
    } catch (_error) {}
    return null;
  };

  convertStackTrace = function(stackTrace, sourceMaps) {
    var atLinePattern, column, convertedLines, filePath, line, mappedLine, match, stackTraceLine, _i, _len, _ref;
    if (sourceMaps == null) {
      sourceMaps = {};
    }
    if (!stackTrace) {
      return stackTrace;
    }
    convertedLines = [];
    atLinePattern = /^(\s+at .* )\((.*):(\d+):(\d+)\)/;
    _ref = stackTrace.split('\n');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      stackTraceLine = _ref[_i];
      if (match = atLinePattern.exec(stackTraceLine)) {
        filePath = match[2];
        line = match[3];
        column = match[4];
        if (path.extname(filePath) === '.js') {
          mappedLine = convertLine(filePath, line, column, sourceMaps);
        }
        if (mappedLine != null) {
          convertedLines.push("" + match[1] + "(" + mappedLine.source + ":" + mappedLine.line + ":" + mappedLine.column + ")");
        } else {
          convertedLines.push(stackTraceLine);
        }
      } else {
        convertedLines.push(stackTraceLine);
      }
    }
    return convertedLines.join('\n');
  };

  exports.convertLine = convertLine;

  exports.convertStackTrace = convertStackTrace;

  exports.setCacheDirectory = function(newCachePath) {
    return cachePath = newCachePath;
  };

  exports.getCacheDirectory = function() {
    return cachePath;
  };

}).call(this);
