"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-classes-per-file
const sp = require("atom-space-pen-views");
class View extends sp.View {
    constructor(options) {
        super();
        this.options = options;
        this.init();
    }
    get $() {
        return this;
    }
    static content() {
        throw new Error("Must override the base View static content member");
    }
    init() {
        /* noop */
    }
}
exports.View = View;
exports.$ = sp.$;
class ScrollView extends sp.ScrollView {
    constructor(options) {
        super();
        this.options = options;
        this.init();
    }
    get $() {
        return this;
    }
    static content() {
        throw new Error("Must override the base View static content member");
    }
    init() {
        /* noop */
    }
}
exports.ScrollView = ScrollView;
//# sourceMappingURL=view.js.map