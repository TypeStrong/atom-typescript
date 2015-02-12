///ts:ref=globals
/// <reference path="../../../globals.ts"/> ///ts:ref:generated

import atom = require('atom');

export class View extends atom.View {
    get $(): JQuery {
        return <any>this;
    }
}

export var $: JQueryStatic = atom.$;
