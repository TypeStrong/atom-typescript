/**
 * THIS FILE IS NO LONGER USED.
 * This is kept as a reference implementation for a simpler language service shot + ScriptInfo
 */
/// <reference path="../../../typings/atom/atom.d.ts"/> ///ts:ref:generated
'use strict';
var ts = require('typescript');
var path = require('path');
var utils = require('../utils');
var fs = require('fs');
function createScriptInfo(fileName, content, isOpen) {
    if (isOpen === void 0) { isOpen = false; }
    var version = 1;
    var editRanges = [];
    var _lineStarts;
    var _lineStartIsDirty = true;
    function getLineStarts() {
        if (_lineStartIsDirty) {
            _lineStarts = ts.computeLineStarts(content);
            _lineStartIsDirty = false;
        }
        return _lineStarts;
    }
    function updateContent(newContent) {
        content = newContent;
        _lineStartIsDirty = true;
        editRanges = [];
        version++;
    }
    function editContent(minChar, limChar, newText) {
        var prefix = content.substring(0, minChar);
        var middle = newText;
        var suffix = content.substring(limChar);
        content = prefix + middle + suffix;
        _lineStartIsDirty = true;
        editRanges.push({
            span: {
                start: minChar,
                length: limChar - minChar
            },
            newLength: newText.length
        });
        version++;
    }
    function getPositionFromLine(line, col) {
        return getLineStarts()[line] + col;
    }
    function getLineAndColForPositon(position) {
        if (position < 0 || position > content.length) {
            throw new RangeError('Argument out of range: position');
        }
        var lineStarts = getLineStarts();
        var lineNumber = utils.binarySearch(lineStarts, position);
        if (lineNumber < 0) {
            lineNumber = (~lineNumber) - 1;
        }
        return {
            line: lineNumber,
            col: position - lineStarts[lineNumber]
        };
    }
    return {
        getFileName: function () {
            return fileName;
        },
        getContent: function () {
            return content;
        },
        getVersion: function () {
            return version;
        },
        getIsOpen: function () {
            return isOpen;
        },
        setIsOpen: function (val) {
            return isOpen = val;
        },
        getEditRanges: function () {
            return editRanges;
        },
        getLineStarts: getLineStarts,
        updateContent: updateContent,
        editContent: editContent,
        getPositionFromLine: getPositionFromLine,
        getLineAndColForPositon: getLineAndColForPositon
    };
}
function getScriptSnapShot(scriptInfo) {
    var lineStarts = scriptInfo.getLineStarts();
    var textSnapshot = scriptInfo.getContent();
    var version = scriptInfo.getVersion();
    var editRanges = scriptInfo.getEditRanges();
    function getChangeRange(oldSnapshot) {
        var unchanged = {
            span: {
                start: 0,
                length: 0
            },
            newLength: 0
        };
        function collapseChangesAcrossMultipleVersions(changes) {
            if (changes.length === 0) {
                return unchanged;
            }
            if (changes.length === 1) {
                return changes[0];
            }
            var change0 = changes[0];
            var oldStartN = change0.span.start;
            var oldEndN = change0.span.start + change0.span.length;
            var newEndN = oldStartN + change0.newLength;
            for (var i = 1; i < changes.length; i++) {
                var nextChange = changes[i];
                var oldStart1 = oldStartN;
                var oldEnd1 = oldEndN;
                var newEnd1 = newEndN;
                var oldStart2 = nextChange.span.start;
                var oldEnd2 = nextChange.span.start + nextChange.span.length;
                var newEnd2 = oldStart2 + nextChange.newLength;
                oldStartN = Math.min(oldStart1, oldStart2);
                oldEndN = Math.max(oldEnd1, oldEnd1 + (oldEnd2 - newEnd1));
                newEndN = Math.max(newEnd2, newEnd2 + (newEnd1 - oldEnd2));
            }
            return {
                span: {
                    start: oldStartN,
                    length: oldEndN - oldStartN
                },
                newLength: newEndN - oldStartN
            };
        }
        ;
        var scriptVersion = oldSnapshot.version || 0;
        if (scriptVersion === version) {
            return unchanged;
        }
        var initialEditRangeIndex = editRanges.length - (version - scriptVersion);
        if (initialEditRangeIndex < 0) {
            return null;
        }
        var entries = editRanges.slice(initialEditRangeIndex);
        return collapseChangesAcrossMultipleVersions(entries);
    }
    return {
        getText: function (start, end) {
            return textSnapshot.substring(start, end);
        },
        getLength: function () {
            return textSnapshot.length;
        },
        getChangeRange: getChangeRange,
        getLineStartPositions: function () {
            return lineStarts;
        },
        version: version
    };
}
exports.defaultLibFile = (path.join(path.dirname(require.resolve('typescript')), 'lib.d.ts')).split('\\').join('/');
var LanguageServiceHost = (function () {
    function LanguageServiceHost(config) {
        var _this = this;
        this.config = config;
        this.fileNameToScript = Object.create(null);
        this.addScript = function (fileName, content) {
            try {
                if (!content)
                    content = fs.readFileSync(fileName).toString();
            }
            catch (ex) {
                content = '';
            }
            var script = createScriptInfo(fileName, content);
            _this.fileNameToScript[fileName] = script;
        };
        this.removeScript = function (fileName) {
            delete _this.fileNameToScript[fileName];
        };
        this.removeAll = function () {
            _this.fileNameToScript = Object.create(null);
        };
        this.updateScript = function (fileName, content) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                script.updateContent(content);
                return;
            }
            else {
                _this.addScript(fileName, content);
            }
        };
        this.editScript = function (fileName, minChar, limChar, newText) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                script.editContent(minChar, limChar, newText);
                return;
            }
            throw new Error('No script with name \'' + fileName + '\'');
        };
        this.setScriptIsOpen = function (fileName, isOpen) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                script.setIsOpen(isOpen);
                return;
            }
            throw new Error('No script with name \'' + fileName + '\'');
        };
        this.getScriptContent = function (fileName) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return script.getContent();
            }
            return null;
        };
        this.hasScript = function (fileName) {
            return !!_this.fileNameToScript[fileName];
        };
        this.getIndexFromPosition = function (fileName, position) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return script.getPositionFromLine(position.line, position.ch);
            }
            return -1;
        };
        this.getPositionFromIndex = function (fileName, index) {
            if (!_this.fileNameToScript[fileName])
                _this.addScript(fileName);
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return script.getLineAndColForPositon(index);
            }
            return null;
        };
        this.getCompilationSettings = function () {
            return _this.config.project.compilerOptions;
        };
        this.getScriptFileNames = function () {
            return Object.keys(_this.fileNameToScript);
        };
        this.getScriptVersion = function (fileName) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return '' + script.getVersion();
            }
            return '0';
        };
        this.getScriptIsOpen = function (fileName) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return script.getIsOpen();
            }
            return false;
        };
        this.getScriptSnapshot = function (fileName) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return getScriptSnapShot(script);
            }
            return null;
        };
        this.getCurrentDirectory = function () {
            return _this.config.projectFileDirectory;
        };
        this.getDefaultLibFileName = function () {
            return 'lib.d.ts';
        };
        config.project.files.forEach(function (file) {
            return _this.addScript(file);
        });
        this.addScript(exports.defaultLibFile);
    }
    return LanguageServiceHost;
})();
exports.LanguageServiceHost = LanguageServiceHost;
