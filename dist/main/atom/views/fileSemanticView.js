var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var atomUtils = require("../atomUtils");
function showForCurrentEditor() {
    var ed = atomUtils.getActiveEditor();
    showForEditor(ed);
}
exports.showForCurrentEditor = showForCurrentEditor;
function showForEditor(ed) {
    // atom.notifications.addInfo('Semantic view coming soon');
}
exports.showForEditor = showForEditor;
var view_1 = require("./view");
var FileSemanticView = (function (_super) {
    __extends(FileSemanticView, _super);
    function FileSemanticView(options) {
        _super.call(this, options);
    }
    FileSemanticView.prototype.init = function () {
        var _this = this;
        this.stopChangingListener = this.options.editor.onDidStopChanging(function () {
        });
        this.destroyListener = this.options.editor.onDidDestroy(function () {
            _this.destroyListener.dispose();
            _this.stopChangingListener.dispose();
        });
    };
    return FileSemanticView;
})(view_1.ScrollView);
