'use strict';
var signal = require('../commons/signal');
var collections = require('../commons/collections');
var ws = require('../commons/workingSet');
var Promise = require('bluebird');

var WorkingSet = (function () {
    function WorkingSet(documentManager, editorManager) {
        var _this = this;
        this.documentManager = documentManager;
        this.editorManager = editorManager;
        this._workingSetChanged = new signal.Signal();
        this._documentEdited = new signal.Signal();
        this.filesSet = new collections.StringSet();
        this.workingSetAddHandler = function (event, file) {
            _this.filesSet.add(file.fullPath);
            _this.workingSetChanged.dispatch({
                kind: 0 /* ADD */,
                paths: [file.fullPath]
            });
        };
        this.workingSetAddListHandler = function (event) {
            var files = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                files[_i] = arguments[_i + 1];
            }
            var paths = files.map(function (file) {
                _this.filesSet.add(file.fullPath);
                return file.fullPath;
            });
            if (paths.length > 0) {
                _this.workingSetChanged.dispatch({
                    kind: 0 /* ADD */,
                    paths: paths
                });
            }
        };
        this.workingSetRemoveHandler = function (event, file) {
            _this.filesSet.remove(file.fullPath);
            _this.workingSetChanged.dispatch({
                kind: 1 /* REMOVE */,
                paths: [file.fullPath]
            });
        };
        this.workingSetRemoveListHandler = function (event) {
            var files = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                files[_i] = arguments[_i + 1];
            }
            var paths = files.map(function (file) {
                _this.filesSet.remove(file.fullPath);
                return file.fullPath;
            });
            if (paths.length > 0) {
                _this.workingSetChanged.dispatch({
                    kind: 1 /* REMOVE */,
                    paths: paths
                });
            }
        };
        this.documentChangesHandler = function (event, document, changes) {
            var changeList = changes.map(function (change) {
                return ({
                    from: change.from,
                    to: change.to,
                    text: change.text && change.text.join('\n'),
                    removed: change.removed ? change.removed.join('\n') : ''
                });
            });

            if (changeList.length > 0) {
                _this.documentEdited.dispatch({
                    path: document.file.fullPath,
                    changeList: changeList,
                    documentText: document.getText()
                });
            }
        };
        this.activeEditorChangeHandler = function (event, current, previous) {
            _this.setActiveEditor(current);
        };
        $(documentManager).on('workingSetAdd', this.workingSetAddHandler);
        $(documentManager).on('workingSetAddList', this.workingSetAddListHandler);
        $(documentManager).on('workingSetRemove', this.workingSetRemoveHandler);
        $(documentManager).on('workingSetRemoveList', this.workingSetRemoveListHandler);

        $(editorManager).on('activeEditorChange', this.activeEditorChangeHandler);

        this.setFiles(documentManager.getWorkingSet().map(function (file) {
            return file.fullPath;
        }));
        this.setActiveEditor(editorManager.getActiveEditor());
    }
    WorkingSet.prototype.getFiles = function () {
        return Promise.cast(this.filesSet.values);
    };

    Object.defineProperty(WorkingSet.prototype, "workingSetChanged", {
        get: function () {
            return this._workingSetChanged;
        },
        enumerable: true,
        configurable: true
    });

    Object.defineProperty(WorkingSet.prototype, "documentEdited", {
        get: function () {
            return this._documentEdited;
        },
        enumerable: true,
        configurable: true
    });

    WorkingSet.prototype.dispose = function () {
        $(this.documentManager).off('workingSetAdd', this.workingSetAddHandler);
        $(this.documentManager).off('workingSetAddList', this.workingSetAddListHandler);
        $(this.documentManager).off('workingSetRemove', this.workingSetRemoveHandler);
        $(this.documentManager).off('workingSetRemoveList', this.workingSetRemoveListHandler);
        $(this.editorManager).off('activeEditorChange', this.activeEditorChangeHandler);
        this.setFiles(null);
        this.setActiveEditor(null);
    };

    WorkingSet.prototype.setFiles = function (files) {
        var _this = this;
        this.filesSet.values.forEach(function (path) {
            return _this.filesSet.remove(path);
        });
        if (files) {
            files.forEach(function (path) {
                return _this.filesSet.add(path);
            });
        }
    };

    WorkingSet.prototype.setActiveEditor = function (editor) {
        if (this.currentDocument) {
            $(this.currentDocument).off('change', this.documentChangesHandler);
        }
        this.currentDocument = editor && editor.document;
        if (this.currentDocument) {
            $(this.currentDocument).on('change', this.documentChangesHandler);
        }
    };
    return WorkingSet;
})();

module.exports = WorkingSet;
