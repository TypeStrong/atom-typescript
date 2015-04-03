import view = require('./view');
var $ = view.$;

export class AstView extends view.View<any> {

    private something: JQuery;
    static content() {
        return this.div({ class: 'awesome' },
            () => this.div({ class: 'dude', outlet: 'something' })
            );
    }

    init() {
        console.log('HERERERERERER')
        this.something.html('<div>tada</div>');
    }
}
