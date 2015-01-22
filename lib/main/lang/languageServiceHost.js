'use strict';
var ts = require('typescript');
var utils = require('./utils');
var LanguageServiceHost;
(function (LanguageServiceHost) {
    function create(baseDir, defaultLibFileName) {
        var compilationSettings;
        var fileNameToScript = Object.create(null);
        function addScript(fileName, content) {
            var script = createScriptInfo(fileName, content);
            fileNameToScript[fileName] = script;
        }
        function removeScript(fileName) {
            delete fileNameToScript[fileName];
        }
        function removeAll() {
            fileNameToScript = Object.create(null);
        }
        function updateScript(fileName, content) {
            var script = fileNameToScript[fileName];
            if (script) {
                script.updateContent(content);
                return;
            }
            throw new Error('No script with name \'' + fileName + '\'');
        }
        function editScript(fileName, minChar, limChar, newText) {
            var script = fileNameToScript[fileName];
            if (script) {
                script.editContent(minChar, limChar, newText);
                return;
            }
            throw new Error('No script with name \'' + fileName + '\'');
        }
        function setScriptIsOpen(fileName, isOpen) {
            var script = fileNameToScript[fileName];
            if (script) {
                script.setIsOpen(isOpen);
                return;
            }
            throw new Error('No script with name \'' + fileName + '\'');
        }
        function setCompilationSettings(settings) {
            compilationSettings = Object.freeze(utils.clone(settings));
        }
        function getScriptContent(fileName) {
            var script = fileNameToScript[fileName];
            if (script) {
                return script.getContent();
            }
            return null;
        }
        function getIndexFromPosition(fileName, position) {
            var script = fileNameToScript[fileName];
            if (script) {
                return script.getPositionFromLine(position.line, position.ch);
            }
            return -1;
        }
        function getPositionFromIndex(fileName, index) {
            var script = fileNameToScript[fileName];
            if (script) {
                return script.getLineAndColForPositon(index);
            }
            return null;
        }
        function getCompilationSettings() {
            return compilationSettings;
        }
        function getScriptFileNames() {
            return Object.keys(fileNameToScript);
        }
        function getScriptVersion(fileName) {
            var script = fileNameToScript[fileName];
            if (script) {
                return '' + script.getVersion();
            }
            return '0';
        }
        function getScriptIsOpen(fileName) {
            var script = fileNameToScript[fileName];
            if (script) {
                return script.getIsOpen();
            }
            return false;
        }
        function getScriptSnapshot(fileName) {
            var script = fileNameToScript[fileName];
            if (script) {
                return getScriptSnapShot(script);
            }
            return null;
        }
        function getCurrentDirectory() {
            return baseDir;
        }
        function getDefaultLibFilename() {
            return defaultLibFileName;
        }
        return {
            log: function () { return void 0; },
            error: function () { return void 0; },
            trace: function () { return void 0; },
            addScript: addScript,
            removeScript: removeScript,
            removeAll: removeAll,
            updateScript: updateScript,
            editScript: editScript,
            getIndexFromPosition: getIndexFromPosition,
            getPositionFromIndex: getPositionFromIndex,
            getScriptContent: getScriptContent,
            setCompilationSettings: setCompilationSettings,
            setScriptIsOpen: setScriptIsOpen,
            getCompilationSettings: getCompilationSettings,
            getScriptFileNames: getScriptFileNames,
            getScriptVersion: getScriptVersion,
            getScriptIsOpen: getScriptIsOpen,
            getScriptSnapshot: getScriptSnapshot,
            getCurrentDirectory: getCurrentDirectory,
            getDefaultLibFilename: getDefaultLibFilename
        };
    }
    LanguageServiceHost.create = create;
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
            editRanges.push(new ts.TextChangeRange(ts.TextSpan.fromBounds(minChar, limChar), newText.length));
            version++;
        }
        function getPositionFromLine(line, ch) {
            return getLineStarts()[line] + ch;
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
                ch: position - lineStarts[lineNumber]
            };
        }
        return {
            getFileName: function () { return fileName; },
            getContent: function () { return content; },
            getVersion: function () { return version; },
            getIsOpen: function () { return isOpen; },
            setIsOpen: function (val) { return isOpen = val; },
            getEditRanges: function () { return editRanges; },
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
            var scriptVersion = oldSnapshot.version || 0;
            if (scriptVersion === version) {
                return ts.TextChangeRange.unchanged;
            }
            var initialEditRangeIndex = editRanges.length - (version - scriptVersion);
            if (initialEditRangeIndex < 0) {
                return null;
            }
            var entries = editRanges.slice(initialEditRangeIndex);
            return ts.TextChangeRange.collapseChangesAcrossMultipleVersions(entries);
        }
        return {
            getText: function (start, end) { return textSnapshot.substring(start, end); },
            getLength: function () { return textSnapshot.length; },
            getChangeRange: getChangeRange,
            getLineStartPositions: function () { return lineStarts; },
            version: version
        };
    }
})(LanguageServiceHost || (LanguageServiceHost = {}));
module.exports = LanguageServiceHost;
