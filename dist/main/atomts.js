"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.provideCodeHighlight = exports.provideDefinitions = exports.provideOutlines = exports.provideReferences = exports.provideHyperclick = exports.provideCodeActions = exports.provideIntentionsHighlight = exports.provideIntentions = exports.provideAutocomplete = exports.consumeBusySignal = exports.consumeSignatureHelp = exports.consumeDatatipService = exports.consumeStatusBar = exports.consumeLinter = exports.deserializeSemanticView = exports.serialize = exports.deactivate = exports.activate = void 0;
const utils_1 = require("../utils");
let pluginManager;
function activate(state) {
    ;
    require("etch").setScheduler(atom.views);
    // tslint:disable-next-line:no-shadowed-variable
    const { PluginManager } = require("./pluginManager");
    pluginManager = new PluginManager(state);
    setImmediate(() => utils_1.handlePromise(checkAndInstallDependencies()));
    // add warning for the slow down
    if (atom.config.get("atom-typescript.checkAllFilesOnSave")) {
        atom.notifications.addInfo(`"Check all files of the project for problems" option is enabled.
    This slows down Atom in big projects.`);
    }
}
exports.activate = activate;
async function checkAndInstallDependencies() {
    const packagesProvidingUIServices = ["atom-ide-ui", "linter", "nuclide"];
    if (!packagesProvidingUIServices.some((p) => atom.packages.isPackageLoaded(p))) {
        const packageDeps = await Promise.resolve().then(() => require("atom-package-deps"));
        await packageDeps.install("atom-typescript", true);
    }
}
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