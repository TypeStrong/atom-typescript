'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ServiceConsumer = require('./serviceConsumer');

var EditorManager = brackets.getModule('editor/EditorManager'), Commands = brackets.getModule('command/Commands'), CommandManager = brackets.getModule('command/CommandManager');

var TypeScriptQuickJumpProvider = (function (_super) {
    __extends(TypeScriptQuickJumpProvider, _super);
    function TypeScriptQuickJumpProvider() {
        _super.apply(this, arguments);
        var _this = this;
        this.handleJumpToDefinition = function () {
            var editor = EditorManager.getFocusedEditor();

            if (!editor || editor.getModeForSelection() !== 'typescript') {
                return null;
            }

            var pos = editor.getCursorPos(), fileName = editor.document.file.fullPath, deferred = $.Deferred();

            _this.getService().then(function (service) {
                service.getDefinitionForFile(fileName, pos).then(function (definitions) {
                    if (!definitions || definitions.length === 0) {
                        deferred.reject();
                    }

                    definitions.filter(function (definition) {
                        return definition.fileName !== fileName || definition.lineStart !== pos.line;
                    });
                    if (definitions.length === 0) {
                        deferred.reject();
                    }
                    if (editor === EditorManager.getFocusedEditor()) {
                        if (editor.getCursorPos().line === pos.line) {
                            var def = definitions[0];
                            if (def.fileName === fileName) {
                                editor.setCursorPos(def.lineStart, def.charStart, true, true);
                                deferred.resolve(true);
                            } else {
                                CommandManager.execute(Commands.FILE_OPEN, { fullPath: def.fileName }).then(function () {
                                    var editor = EditorManager.getFocusedEditor();
                                    editor.setCursorPos(def.lineStart, def.charStart, true, true);
                                    deferred.resolve(true);
                                }, function () {
                                    return deferred.reject();
                                });
                            }
                            return;
                        }
                    }
                    deferred.reject();
                }, function () {
                    return deferred.reject();
                });
            });
            return deferred.promise();
        };
    }
    return TypeScriptQuickJumpProvider;
})(ServiceConsumer);

module.exports = TypeScriptQuickJumpProvider;
