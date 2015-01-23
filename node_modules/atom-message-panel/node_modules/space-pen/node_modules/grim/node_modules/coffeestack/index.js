(function() {
  var CoffeeScript, SourceMapConsumer, convertLine, convertStackTrace, fs, path;

  fs = require('fs');

  path = require('path');

  CoffeeScript = require('coffee-script');

  SourceMapConsumer = require('source-map').SourceMapConsumer;

  convertLine = function(filePath, line, column, sourceMaps) {
    var code, position, source, sourceMap, sourceMapContents, sourceMapPath, v3SourceMap;
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
          v3SourceMap = CoffeeScript.compile(code, {
            sourceMap: true,
            filename: filePath
          }).v3SourceMap;
          sourceMapContents = v3SourceMap;
        }
      }
      if (sourceMapContents) {
        sourceMaps[filePath] = sourceMapContents;
        sourceMap = new SourceMapConsumer(sourceMapContents);
        position = sourceMap.originalPositionFor({
          line: line,
          column: column
        });
        if ((position.line != null) && (position.column != null)) {
          if (position.source) {
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

  module.exports = {
    convertLine: convertLine,
    convertStackTrace: convertStackTrace
  };

}).call(this);
