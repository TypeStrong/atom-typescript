"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let pluginManager;
async function activate(state) {
    const pns = atom.packages.getAvailablePackageNames();
    const packagesProvidingUIServices = ["atom-ide-ui", "linter", "nuclide"];
    if (!packagesProvidingUIServices.some(p => pns.includes(p))) {
        const mod = require("atom-package-deps");
        await mod.install("atom-typescript", true);
    }
    ;
    require("etch").setScheduler(atom.views);
    // tslint:disable-next-line:no-shadowed-variable
    const { PluginManager } = require("./pluginManager");
    pluginManager = new PluginManager(state);
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
function deserializeSemanticView(serialized) {
    const { 
    // tslint:disable-next-line: no-shadowed-variable
    SemanticView, } = require("./atom/views/outline/semanticView");
    return SemanticView.create(serialized.data);
}
exports.deserializeSemanticView = deserializeSemanticView;
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
function consumeDatatipService(datatipService) {
    if (pluginManager)
        return pluginManager.consumeDatatipService(datatipService);
}
exports.consumeDatatipService = consumeDatatipService;
function consumeSignatureHelp(registry) {
    if (pluginManager)
        return pluginManager.consumeSigHelpService(registry);
}
exports.consumeSignatureHelp = consumeSignatureHelp;
function consumeBusySignal(busySignalService) {
    if (pluginManager)
        return pluginManager.consumeBusySignal(busySignalService);
}
exports.consumeBusySignal = consumeBusySignal;
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
function provideIntentionsHighlight() {
    if (pluginManager)
        return pluginManager.provideIntentionsHighlight();
}
exports.provideIntentionsHighlight = provideIntentionsHighlight;
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
function provideReferences() {
    if (pluginManager)
        return pluginManager.provideReferences();
}
exports.provideReferences = provideReferences;
function provideOutlines() {
    if (pluginManager)
        return pluginManager.provideOutlines();
}
exports.provideOutlines = provideOutlines;
function provideDefinitions() {
    if (pluginManager)
        return pluginManager.provideDefinitions();
}
exports.provideDefinitions = provideDefinitions;
function provideCodeHighlight() {
    if (pluginManager)
        return pluginManager.provideCodeHighlight();
}
exports.provideCodeHighlight = provideCodeHighlight;
//# sourceMappingURL=atomts.js.map