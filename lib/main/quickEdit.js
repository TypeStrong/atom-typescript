'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ServiceConsumer = require('./serviceConsumer');
var DocumentManager = brackets.getModule('document/DocumentManager'), MultiRangeInlineEditor = brackets.getModule('editor/MultiRangeInlineEditor').MultiRangeInlineEditor;
var TypeScriptQuickEditProvider = (function (_super) {
    __extends(TypeScriptQuickEditProvider, _super);
    function TypeScriptQuickEditProvider() {
        var _this = this;
        _super.apply(this, arguments);
        this.typeScriptInlineEditorProvider = function (hostEditor, pos) {
            if (hostEditor.getModeForSelection() !== 'typescript') {
                return null;
            }
            var sel = hostEditor.getSelection(false);
            if (sel.start.line !== sel.end.line) {
                return null;
            }
            var deferred = $.Deferred();
            _this.getService().then(function (service) {
                var fileName = hostEditor.document.file.fullPath;
                service.getDefinitionForFile(fileName, pos).then(function (definitions) {
                    if (!definitions || definitions.length === 0) {
                        deferred.reject();
                    }
                    definitions.filter(function (definition) { return definition.fileName !== fileName || definition.lineStart !== pos.line; });
                    if (definitions.length === 0) {
                        deferred.reject();
                    }
                    var promises = [], ranges = [];
                    definitions.forEach(function (definition) {
                        promises.push(DocumentManager.getDocumentForPath(definition.fileName).then(function (doc) {
                            ranges.push({
                                document: doc,
                                name: definition.name,
                                lineStart: definition.lineStart,
                                lineEnd: definition.lineEnd,
                                fileName: definition.fileName
                            });
                        }));
                    });
                    return $.when.apply($, promises).then(function () {
                        var inlineEditor = new MultiRangeInlineEditor(ranges);
                        inlineEditor.load(hostEditor);
                        deferred.resolve(inlineEditor);
                    });
                }).catch(function (e) {
                    deferred.reject();
                });
            });
            return deferred.promise();
        };
    }
    return TypeScriptQuickEditProvider;
})(ServiceConsumer);
module.exports = TypeScriptQuickEditProvider;
