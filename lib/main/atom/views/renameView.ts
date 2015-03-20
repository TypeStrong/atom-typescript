import view = require('./view');
var $ = view.$;
var html = require('../../../../views/renameView.html');

interface EditorView extends JQuery {
    model: AtomCore.IEditor;
}

interface RenameViewOptions {
    text: string;
    onCommit: (newValue: string) => any;
    onCancel: () => any;
    /** A truthy string return indicates a validation error */
    onValidate: (newValue: string) => string;
}

export class RenameView
    extends view.View<RenameViewOptions> {

    private newNameEditor: EditorView;
    private validationMessage: JQuery;
    static content = html;

    public init() {
        $(atom.views.getView(atom.workspace)).on('keydown',(e) => {
            if (e.keyCode == 27) { // escape
                if (this.options.onCancel) {
                    this.options.onCancel();
                    this.clearView();
                }
            }
        });

        this.newNameEditor.on('keydown',(e) => {
            var newText = this.newNameEditor.model.getText();
            if (e.keyCode == 13) { // enter
                var invalid = this.options.onValidate(newText);
                if(invalid){
                    this.validationMessage.text(invalid);
                    this.validationMessage.show();
                    return;
                }
                this.validationMessage.hide();
                
                if (this.options.onCommit) {
                    this.options.onCommit(newText);
                    this.clearView();
                }
            }
            if (e.keyCode == 27) { // escape
                if (this.options.onCancel) {
                    this.options.onCancel();
                    this.clearView();
                }
            }
        });
    }

    public editorAtRenameStart:AtomCore.IEditor = null;
    public clearView() {
        if(this.editorAtRenameStart && !this.editorAtRenameStart.isDestroyed()){
            var view = atom.views.getView(this.editorAtRenameStart);
            view.focus();
        }
        panel.hide();
        this.options = <any>{};
        this.editorAtRenameStart = null;
    }

    public renameThis(options: RenameViewOptions) {
        this.options = options;
        this.editorAtRenameStart = atom.workspace.getActiveEditor();
        panel.show();
        this.newNameEditor.model.setText(options.text);
        this.newNameEditor.model.selectAll();
        this.newNameEditor.focus();
    }
}

export var panelView: RenameView;
var panel: AtomCore.Panel;
export function attach() {
    panelView = new RenameView();
    panel = atom.workspace.addModalPanel({ item: panelView, priority: 1000, visible: false });
}
