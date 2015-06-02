import view = require('./view');
var $ = view.$;

export class AwesomePanelView extends view.View<any> {

    private something: JQuery;
    static content() {
        return this.div({ class: 'awesome' },
            () => this.div({ class: 'dude', outlet: 'something' })
            );
    }

    init() {
        this.something.html('<div>tada</div>');
    }
}

export var panelView: AwesomePanelView;
export var panel: AtomCore.Panel;
export function attach() {
    panelView = new AwesomePanelView({});
    panel = atom.workspace.addModalPanel({ item: panelView, priority: 1000, visible: false });

    /*setInterval(() => {
        panel.isVisible() ? panel.hide() : panel.show();
        console.log('called');
    }, 1000);*/

}
