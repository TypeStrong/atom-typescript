"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
function listen(element, event, selector, callback) {
    const bound = (evt) => {
        const sel = evt.target.closest(selector);
        if (sel && element.contains(sel)) {
            callback(evt);
        }
    };
    element.addEventListener(event, bound);
    return new atom_1.Disposable(() => {
        element.removeEventListener(event, bound);
    });
}
exports.listen = listen;
//# sourceMappingURL=element-listener.js.map