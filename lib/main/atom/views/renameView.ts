import view = require('./view');
var $ = view.$;
var html = require('./renameView.html');

export class RenameView extends view.View {

    private something: JQuery;
    static content = html;

    constructor(options?: any) {
        super();
    }

    initialize() {

    }
}

export var panelView: RenameView;
export var panel: AtomCore.Panel;
export function attach() {
    panelView = new RenameView();
    panel = atom.workspace.addModalPanel({ item: panelView, priority: 1000, visible: false });

    // Test
    // panel.show();
}
