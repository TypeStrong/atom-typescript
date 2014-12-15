'use strict';
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ServiceConsumer = require('./serviceConsumer');
var EditorManager = brackets.getModule('editor/EditorManager'), QuickOpen = brackets.getModule('search/QuickOpen');
var Session = (function () {
    function Session(items) {
        this.items = items;
    }
    return Session;
})();
var TypeScriptQuickFindDefitionProvider = (function (_super) {
    __extends(TypeScriptQuickFindDefitionProvider, _super);
    function TypeScriptQuickFindDefitionProvider() {
        var _this = this;
        _super.apply(this, arguments);
        this.name = 'TypeScriptQuickFindDefitionProvider';
        this.languageIds = ['typescript'];
        this.label = 'TypeScript';
        this.search = function (request, stringMatcher) {
            request = request.slice(request.indexOf('@') + 1, request.length);
            return _this.getSession().then(function (session) {
                return session.items.filter(function (item) {
                    return !!stringMatcher.match(item.name, request);
                });
            });
        };
        this.done = function () {
            _this.session = null;
        };
        this.itemSelect = function (item) {
            _this.itemFocus(item);
        };
        this.itemFocus = function (item) {
            _this.setCurrentPosition(item.position);
        };
    }
    TypeScriptQuickFindDefitionProvider.prototype.match = function (query) {
        return query.indexOf('@') === 0;
    };
    TypeScriptQuickFindDefitionProvider.prototype.resultsFormatter = function (item) {
        var displayName = QuickOpen.highlightMatch(item.name);
        displayName = item.containerName ? item.containerName + '.' + displayName : displayName;
        return '<li>' + displayName + '</li>';
    };
    TypeScriptQuickFindDefitionProvider.prototype.getSession = function () {
        var _this = this;
        return $.Deferred(function (deferred) {
            if (_this.session) {
                deferred.resolve(_this.session);
            }
            else {
                _this.getService().then(function (lexicalStructureService) {
                    var editor = EditorManager.getActiveEditor(), currentFile = editor.document.file.fullPath;
                    lexicalStructureService.getLexicalStructureForFile(currentFile).then(function (items) {
                        _this.session = new Session(items);
                        deferred.resolve(_this.session);
                    });
                });
            }
        }).promise();
    };
    TypeScriptQuickFindDefitionProvider.prototype.setCurrentPosition = function (pos) {
        EditorManager.getActiveEditor().setCursorPos(pos.line, pos.ch, true, true);
    };
    return TypeScriptQuickFindDefitionProvider;
})(ServiceConsumer);
module.exports = TypeScriptQuickFindDefitionProvider;
