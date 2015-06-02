import view = require('./view');
var $ = view.$;
var html = require('../../../../views/renameView.html');

interface EditorView extends JQuery {
    model: AtomCore.IEditor;
}

interface RenameViewOptions {
    autoSelect: boolean;
    title: string;
    text: string;
    onCommit: (newValue: string) => any;
    onCancel: () => any;
    /** A truthy string return indicates a validation error */
    onValidate: (newValue: string) => string;
    openFiles: string[];
    closedFiles: string[];
}

export class RenameView
    extends view.View<RenameViewOptions> {

    private newNameEditor: EditorView;
    private validationMessage: JQuery;
    private fileCount: JQuery;
    private title: JQuery;
    static content = html;

    public init() {
        $(atom.views.getView(atom.workspace)).on('keydown', (e) => {
            if (e.keyCode == 27) { // escape
                if (this.options.onCancel) {
                    this.options.onCancel();
                    this.clearView();
                }
            }
        });

        this.newNameEditor.on('keydown', (e) => {
            var newText = this.newNameEditor.model.getText();
            if (e.keyCode == 13) { // enter
                var invalid = this.options.onValidate(newText);
                if (invalid) {
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

    public editorAtRenameStart: AtomCore.IEditor = null;
    public clearView() {
        if (this.editorAtRenameStart && !this.editorAtRenameStart.isDestroyed()) {
            var view = atom.views.getView(this.editorAtRenameStart);
            view.focus();
        }
        panel.hide();
        this.options = <any>{};
        this.editorAtRenameStart = null;
    }

    public renameThis(options: RenameViewOptions) {
        this.options = options;
        this.editorAtRenameStart = atom.workspace.getActiveTextEditor();
        panel.show();

        this.newNameEditor.model.setText(options.text);
        if (this.options.autoSelect) {
            this.newNameEditor.model.selectAll();
        }
        else {
            this.newNameEditor.model.moveToEndOfScreenLine();
        }
        this.title.text(this.options.title);
        this.newNameEditor.focus();

        this.validationMessage.hide();

        this.fileCount.html(`<div>
            Files Counts: <span class='highlight'> Already Open ( ${options.openFiles.length} )</span> and <span class='highlight'> Currently Closed ( ${options.closedFiles.length} ) </span>
        </div>`);
    }
}

export var panelView: RenameView;
var panel: AtomCore.Panel;
export function attach() {
    panelView = new RenameView(<any>{});
    panel = atom.workspace.addModalPanel({ item: panelView, priority: 1000, visible: false });
}
