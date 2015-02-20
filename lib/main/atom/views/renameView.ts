import view = require('./view');
var $ = view.$;
var html = require('./renameView.html');

interface EditorView extends JQuery {
    model: AtomCore.IEditor;
}

interface RenameViewOptions {
    text: string;
    onCommit: (newValue: string) => any;
    onCancel: () => any;
}

export class RenameView
    extends view.View<RenameViewOptions> {

    private newNameEditor: EditorView;
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
            if (e.keyCode == 13) { // enter
                if (this.options.onCommit) {
                    this.options.onCommit(this.newNameEditor.model.getText());
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

    public clearView() {
        panel.hide();
        this.options = <any>{};
    }

    public renameThis(options: RenameViewOptions) {

        this.options = options;
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
