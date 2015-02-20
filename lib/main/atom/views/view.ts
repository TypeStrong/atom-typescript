///ts:ref=globals
/// <reference path="../../../globals.ts"/> ///ts:ref:generated

import atom = require('atom');

export class View<Options> extends atom.View {
    get $(): JQuery {
        return <any>this;
    }

    static content() {
        throw new Error('Must override the base View static content member');
    }

    constructor(public options: Options = <any>{}) {
        super();
        this.init();
    }
    init() { }
}

export var $: JQueryStatic = atom.$;
