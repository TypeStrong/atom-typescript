var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var atomConfig = require("../atomConfig");
var atomUtils = require("../atomUtils");
var view = require("./view");
var React = require('react');
var MyComponent = (function (_super) {
    __extends(MyComponent, _super);
    function MyComponent(props) {
        _super.call(this, props);
        this.state = {};
    }
    MyComponent.prototype.componentDidMount = function () {
        // We listen to a few things
        var _this = this;
        var editorScrolling;
        var editorChanging;
        var subscribeToEditor = function (editor) {
            _this.currentEditor = editor;
            _this.forceUpdate();
            panel.show();
        };
        var unsubscribeToEditor = function () {
            if (!_this.currentEditor)
                return;
            _this.currentEditor = undefined;
            panel.hide();
        };
        if (atomUtils.isActiveEditorOnDiskAndTs()) {
            subscribeToEditor(atomUtils.getActiveEditor());
        }
        atom.workspace.onDidChangeActivePaneItem(function (editor) {
            if (atomUtils.onDiskAndTs(editor)) {
                subscribeToEditor(editor);
            }
            else {
                unsubscribeToEditor();
            }
        });
    };
    MyComponent.prototype.componentWillUnmount = function () {
    };
    MyComponent.prototype.render = function () {
        return React.createElement("div", null, "Current editor: ", React.createElement("br", null), this.currentEditor ? this.currentEditor.getPath() : "");
    };
    return MyComponent;
})(React.Component);
var SemanticView = (function (_super) {
    __extends(SemanticView, _super);
    function SemanticView(config) {
        _super.call(this, config);
        this.config = config;
        React.render(React.createElement(MyComponent, {}), this.rootDomElement);
    }
    Object.defineProperty(SemanticView.prototype, "rootDomElement", {
        get: function () {
            return this.mainContent[0];
        },
        enumerable: true,
        configurable: true
    });
    SemanticView.content = function () {
        var _this = this;
        return this.div({ class: 'atomts-semantic-view native-key-bindings' }, function () {
            _this.div({ outlet: 'mainContent' });
        });
    };
    return SemanticView;
})(view.View);
exports.SemanticView = SemanticView;
var panel;
function attach() {
    if (exports.mainView) {
        return;
    }
    exports.mainView = new SemanticView({});
    panel = atom.workspace.addRightPanel({ item: exports.mainView, priority: 1000, visible: atomConfig.showSemanticView && atomUtils.isActiveEditorOnDiskAndTs() });
}
exports.attach = attach;
function toggle() {
    if (panel.isVisible()) {
        atomConfig.showSemanticView = (false);
        panel.hide();
    }
    else {
        atomConfig.showSemanticView = (true);
        panel.show();
    }
}
exports.toggle = toggle;
