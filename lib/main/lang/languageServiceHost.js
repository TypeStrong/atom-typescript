'use strict';
var ts = require('typescript');
var path = require('path');
var utils = require('./utils');
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
var LanguageServiceHost = (function () {
    function LanguageServiceHost(config) {
        var _this = this;
        this.config = config;
        this.fileNameToScript = Object.create(null);
        this.addScript = function (fileName) {
            var content = '';
            try {
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
            throw new Error('No script with name \'' + fileName + '\'');
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
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return script.getLineAndColForPositon(index);
            }
            return null;
        };
        this.getCompilationSettings = function () { return _this.config.project.compilerOptions; };
        this.getScriptFileNames = function () { return Object.keys(_this.fileNameToScript); };
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
        this.getDefaultLibFilename = function () {
            return 'lib.d.ts';
        };
        this.log = function () { return void 0; };
        this.error = function () { return void 0; };
        this.trace = function () { return void 0; };
        config.project.files.forEach(function (file) { return _this.addScript(file); });
        var libFile = (path.join(path.dirname(require.resolve('typescript')), 'lib.d.ts'));
        this.addScript(libFile);
    }
    return LanguageServiceHost;
})();
exports.LanguageServiceHost = LanguageServiceHost;
