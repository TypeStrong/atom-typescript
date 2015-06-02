

import sp = require("atom-space-pen-views");

export class View<Options> extends sp.View {
    get $(): JQuery {
        return <any>this;
    }

    static content() {
        throw new Error('Must override the base View static content member');
    }

    constructor(public options: Options) {
        super();
        this.init();
    }
    init() { }
}

export var $ = sp.$;

export class ScrollView<Options> extends sp.ScrollView {
    get $(): JQuery {
        return <any>this;
    }

    static content() {
        throw new Error('Must override the base View static content member');
    }

    constructor(public options: Options) {
        super();
        this.init();
    }
    init() { }
}