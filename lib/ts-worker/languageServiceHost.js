'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var logger = require('../commons/logger');
var collections = require('../commons/collections');
var path = require('path');
var utils = require('../commons/utils');
var LanguageServiceHost = (function (_super) {
    __extends(LanguageServiceHost, _super);
    function LanguageServiceHost() {
        _super.apply(this, arguments);
        this.fileNameToScript = new collections.StringMap();
    }
    LanguageServiceHost.prototype.addScript = function (fileName, content) {
        var script = new ScriptInfo(fileName, content);
        this.fileNameToScript.set(fileName, script);
    };
    LanguageServiceHost.prototype.removeScript = function (fileName) {
        this.fileNameToScript.delete(fileName);
    };
    LanguageServiceHost.prototype.removeAll = function () {
        this.fileNameToScript.clear();
    };
    LanguageServiceHost.prototype.updateScript = function (fileName, content) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            script.updateContent(content);
            return;
        }
        throw new Error('No script with name \'' + fileName + '\'');
    };
    LanguageServiceHost.prototype.editScript = function (fileName, minChar, limChar, newText) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            script.editContent(minChar, limChar, newText);
            return;
        }
        throw new Error('No script with name \'' + fileName + '\'');
    };
    LanguageServiceHost.prototype.setScriptIsOpen = function (fileName, isOpen) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            script.isOpen = isOpen;
            return;
        }
        throw new Error('No script with name \'' + fileName + '\'');
    };
    LanguageServiceHost.prototype.setCompilationSettings = function (settings) {
        this.compilationSettings = Object.freeze(utils.clone(settings));
    };
    LanguageServiceHost.prototype.getScriptContent = function (fileName) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return script.content;
        }
        return null;
    };
    LanguageServiceHost.prototype.getIndexFromPos = function (fileName, position) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return script.getPositionFromLine(position.line, position.ch);
        }
        return -1;
    };
    LanguageServiceHost.prototype.indexToPosition = function (fileName, index) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            var tsPosition = script.getLineAndColForPositon(index);
            return {
                ch: tsPosition.character,
                line: tsPosition.line
            };
        }
        return null;
    };
    LanguageServiceHost.prototype.getCompilationSettings = function () {
        return this.compilationSettings;
    };
    LanguageServiceHost.prototype.getScriptFileNames = function () {
        return this.fileNameToScript.keys;
    };
    LanguageServiceHost.prototype.getScriptSnapshot = function (fileName) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return new ScriptSnapshot(script);
        }
        return null;
    };
    LanguageServiceHost.prototype.getScriptVersion = function (fileName) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return script.version;
        }
        return 0;
    };
    LanguageServiceHost.prototype.getScriptIsOpen = function (fileName) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return script.isOpen;
        }
        return false;
    };
    LanguageServiceHost.prototype.getScriptByteOrderMark = function (fileName) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return script.byteOrderMark;
        }
        return 0 /* None */;
    };
    LanguageServiceHost.prototype.getDiagnosticsObject = function () {
        return new LanguageServicesDiagnostics('');
    };
    LanguageServiceHost.prototype.getLocalizedDiagnosticMessages = function () {
        return '';
    };
    LanguageServiceHost.prototype.fileExists = function (s) {
        return this.fileNameToScript.has(s);
    };
    LanguageServiceHost.prototype.directoryExists = function (s) {
        return true;
    };
    LanguageServiceHost.prototype.resolveRelativePath = function (fileName, directory) {
        return utils.pathResolve(directory, fileName);
    };
    LanguageServiceHost.prototype.getParentDirectory = function (fileName) {
        return path.dirname(fileName);
    };
    return LanguageServiceHost;
})(logger.LogingClass);
var ScriptInfo = (function () {
    function ScriptInfo(fileName, content, isOpen, byteOrderMark) {
        if (isOpen === void 0) { isOpen = false; }
        if (byteOrderMark === void 0) { byteOrderMark = 0 /* None */; }
        this.version = 1;
        this.editRanges = [];
        this.lineMap = null;
        this.fileName = fileName;
        this.content = content;
        this.isOpen = isOpen;
        this.byteOrderMark = byteOrderMark;
        this.setContent(content);
    }
    ScriptInfo.prototype.updateContent = function (newContent) {
        this.setContent(newContent);
        this.editRanges = [];
        this.version++;
    };
    ScriptInfo.prototype.editContent = function (minChar, limChar, newText) {
        var prefix = this.content.substring(0, minChar);
        var middle = newText;
        var suffix = this.content.substring(limChar);
        this.setContent(prefix + middle + suffix);
        this.editRanges.push(new TypeScript.TextChangeRange(TypeScript.TextSpan.fromBounds(minChar, limChar), newText.length));
        this.version++;
    };
    ScriptInfo.prototype.getPositionFromLine = function (line, character) {
        return this.lineMap.getPosition(line, character);
    };
    ScriptInfo.prototype.getLineAndColForPositon = function (position) {
        var lineAndChar = { line: -1, character: -1 };
        this.lineMap.fillLineAndCharacterFromPosition(position, lineAndChar);
        return lineAndChar;
    };
    ScriptInfo.prototype.setContent = function (content) {
        this.content = content;
        this.lineMap = TypeScript.LineMap1.fromString(content);
    };
    return ScriptInfo;
})();
var ScriptSnapshot = (function () {
    function ScriptSnapshot(scriptInfo) {
        this.lineMap = null;
        this.scriptInfo = scriptInfo;
        this.textSnapshot = scriptInfo.content;
        this.version = scriptInfo.version;
        this.editRanges = scriptInfo.editRanges.slice(0);
    }
    ScriptSnapshot.prototype.getText = function (start, end) {
        return this.textSnapshot.substring(start, end);
    };
    ScriptSnapshot.prototype.getLength = function () {
        return this.textSnapshot.length;
    };
    ScriptSnapshot.prototype.getLineStartPositions = function () {
        if (this.lineMap === null) {
            this.lineMap = TypeScript.LineMap1.fromString(this.textSnapshot);
        }
        return this.lineMap.lineStarts();
    };
    ScriptSnapshot.prototype.getTextChangeRangeSinceVersion = function (scriptVersion) {
        if (scriptVersion === this.version) {
            return TypeScript.TextChangeRange.unchanged;
        }
        var initialEditRangeIndex = this.editRanges.length - (this.version - scriptVersion);
        if (initialEditRangeIndex < 0) {
            return null;
        }
        var entries = this.editRanges.slice(initialEditRangeIndex);
        return TypeScript.TextChangeRange.collapseChangesAcrossMultipleVersions(entries);
    };
    return ScriptSnapshot;
})();
var LanguageServicesDiagnostics = (function () {
    function LanguageServicesDiagnostics(destination) {
        this.destination = destination;
    }
    LanguageServicesDiagnostics.prototype.log = function (content) {
    };
    return LanguageServicesDiagnostics;
})();
module.exports = LanguageServiceHost;
