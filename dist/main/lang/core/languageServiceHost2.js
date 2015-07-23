var path = require('path');
var fs = require('fs');
var textBuffer = require('basarat-text-buffer');
function createScriptInfo(fileName, text, isOpen) {
    if (isOpen === void 0) { isOpen = false; }
    var version = 1;
    var editRanges = [];
    var _lineStarts;
    var _lineStartIsDirty = true;
    var buffer = new textBuffer(text);
    function getLineStarts() {
        if (_lineStartIsDirty) {
            _lineStarts = [];
            var totalLength = 0;
            buffer.lines.forEach(function (line, index) {
                _lineStarts.push(totalLength);
                var lineLength = line.length;
                totalLength = totalLength + lineLength + buffer.lineEndings[index].length;
            });
            _lineStartIsDirty = false;
        }
        return _lineStarts;
    }
    function updateContent(newContent) {
        buffer = new textBuffer(newContent);
        _lineStartIsDirty = true;
        editRanges = [];
        version++;
    }
    function editContent(minChar, limChar, newText) {
        var start = getLineAndColForPositon(minChar);
        var end = getLineAndColForPositon(limChar);
        buffer.setTextInRange([[start.line, start.col], [end.line, end.col]], newText, { normalizeLineEndings: false });
        _lineStartIsDirty = true;
        editRanges.push({
            span: { start: minChar, length: limChar - minChar },
            newLength: newText.length
        });
        version++;
    }
    function getPositionFromLine(line, ch) {
        return buffer.characterIndexForPosition([line, ch]);
    }
    function getLineAndColForPositon(position) {
        var _a = buffer.positionForCharacterIndex(position), row = _a.row, column = _a.column;
        return {
            line: row,
            col: column
        };
    }
    function getLinePreview(line) {
        return (buffer.lines[line] || '').trim();
    }
    return {
        getFileName: function () { return fileName; },
        getContent: function () { return buffer.getText(); },
        getVersion: function () { return version; },
        getIsOpen: function () { return isOpen; },
        setIsOpen: function (val) { return isOpen = val; },
        getEditRanges: function () { return editRanges; },
        getLineStarts: getLineStarts,
        updateContent: updateContent,
        editContent: editContent,
        getPositionFromLine: getPositionFromLine,
        getLineAndColForPositon: getLineAndColForPositon,
        getLinePreview: getLinePreview
    };
}
function getScriptSnapShot(scriptInfo) {
    var lineStarts = scriptInfo.getLineStarts();
    var textSnapshot = scriptInfo.getContent();
    var version = scriptInfo.getVersion();
    var editRanges = scriptInfo.getEditRanges();
    function getChangeRange(oldSnapshot) {
        var unchanged = { span: { start: 0, length: 0 }, newLength: 0 };
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
            return { span: { start: oldStartN, length: oldEndN - oldStartN }, newLength: newEndN - oldStartN };
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
        getText: function (start, end) { return textSnapshot.substring(start, end); },
        getLength: function () { return textSnapshot.length; },
        getChangeRange: getChangeRange,
    };
}
exports.getDefaultLibFilePath = function (options) {
    var filename = ts.getDefaultLibFileName(options);
    return (path.join(path.dirname(require.resolve('ntypescript')), filename)).split('\\').join('/');
};
exports.typescriptDirectory = path.dirname(require.resolve('ntypescript')).split('\\').join('/');
var LanguageServiceHost = (function () {
    function LanguageServiceHost(config) {
        var _this = this;
        this.config = config;
        this.fileNameToScript = Object.create(null);
        this.addScript = function (fileName, content) {
            try {
                if (!content) {
                    content = fs.readFileSync(fileName).toString();
                }
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
        this.editScript = function (fileName, start, end, newText) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                var minChar = script.getPositionFromLine(start.line, start.col);
                var limChar = script.getPositionFromLine(end.line, end.col);
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
                return script.getPositionFromLine(position.line, position.col);
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
        this.getPositionFromTextSpanWithLinePreview = function (fileName, textSpan) {
            var position = _this.getPositionFromIndex(fileName, textSpan.start);
            var script = _this.fileNameToScript[fileName];
            var preview = script.getLinePreview(position.line);
            return { preview: preview, position: position };
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
            else if (fs.existsSync(fileName)) {
                _this.config.project.files.push(fileName);
                _this.addScript(fileName);
                return _this.getScriptSnapshot(fileName);
            }
            return null;
        };
        this.getCurrentDirectory = function () {
            return _this.config.projectFileDirectory;
        };
        this.getDefaultLibFileName = ts.getDefaultLibFileName;
        if (!config.project.compilerOptions.noLib) {
            this.addScript(exports.getDefaultLibFilePath(config.project.compilerOptions));
        }
    }
    return LanguageServiceHost;
})();
exports.LanguageServiceHost = LanguageServiceHost;
