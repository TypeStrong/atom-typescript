"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var semanticView_1 = require("./atom/views/outline/semanticView");
exports.deserializeSemanticView = semanticView_1.deserializeSemanticView;
let pluginManager;
async function activate(state) {
    // tslint:disable:no-unsafe-any
    const pns = atom.packages.getAvailablePackageNames();
    if (!(pns.includes("atom-ide-ui") || pns.includes("linter"))) {
        await require("atom-package-deps").install("atom-typescript", true);
    }
    require("etch").setScheduler(atom.views);
    // tslint:disable-next-line:no-shadowed-variable
    const { PluginManager } = require("./pluginManager");
    pluginManager = new PluginManager(state);
    // tslint:enable:no-unsafe-any
}
exports.activate = activate;
function deactivate() {
    if (pluginManager)
        pluginManager.destroy();
    pluginManager = undefined;
}
exports.deactivate = deactivate;
function serialize() {
    if (pluginManager)
        return pluginManager.serialize();
    else
        return undefined;
}
exports.serialize = serialize;
////////////////////////////////// Consumers ///////////////////////////////////
function consumeLinter(register) {
    if (pluginManager)
        return pluginManager.consumeLinter(register);
}
exports.consumeLinter = consumeLinter;
function consumeStatusBar(statusBar) {
    if (pluginManager)
        return pluginManager.consumeStatusBar(statusBar);
}
exports.consumeStatusBar = consumeStatusBar;
////////////////////////////////// Providers ///////////////////////////////////
function provideAutocomplete() {
    if (pluginManager)
        return pluginManager.provideAutocomplete();
}
exports.provideAutocomplete = provideAutocomplete;
function provideIntentions() {
    if (pluginManager)
        return pluginManager.provideIntentions();
}
exports.provideIntentions = provideIntentions;
function provideCodeActions() {
    if (pluginManager)
        return pluginManager.provideCodeActions();
}
exports.provideCodeActions = provideCodeActions;
function provideHyperclick() {
    if (pluginManager)
        return pluginManager.provideHyperclick();
}
exports.provideHyperclick = provideHyperclick;
//# sourceMappingURL=atomts.js.map