"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const etch = require("etch");
const highlightComponent_1 = require("../views/highlightComponent");
registry_1.addCommand("atom-text-editor", "typescript:refactor-selection", deps => ({
    description: "Get a list of applicable refactors to selected code",
    async didDispatch(editor) {
        const location = utils_1.getFilePathPosition(editor);
        if (!location)
            return;
        const selection = editor.getSelectedBufferRange();
        const client = await deps.getClient(location.file);
        const fileRange = selection.isEmpty()
            ? location
            : {
                file: location.file,
                startLine: selection.start.row + 1,
                startOffset: selection.start.column + 1,
                endLine: selection.end.row + 1,
                endOffset: selection.end.column + 1,
            };
        const actions = await getApplicableRefactorsActions(client, fileRange);
        if (actions.length === 0) {
            atom.notifications.addInfo("AtomTS: No applicable refactors for the selection");
            return;
        }
        const selectedAction = await simpleSelectionView_1.selectListView({
            items: actions,
            itemTemplate: (item, ctx) => {
                return (etch.dom("li", null,
                    etch.dom(highlightComponent_1.HighlightComponent, { label: `${item.refactorDescription}: ${item.actionDescription}`, query: ctx.getFilterQuery() })));
            },
            itemFilterKey: "actionDescription",
        });
        if (selectedAction === undefined)
            return;
        await applyRefactors(selectedAction, fileRange, client, deps);
    },
}));
async function getApplicableRefactorsActions(client, pointOrRange) {
    const responseApplicable = await getApplicabeRefactors(client, pointOrRange);
    if (!responseApplicable)
        return [];
    if (responseApplicable.body === undefined || responseApplicable.body.length === 0) {
        return [];
    }
    const actions = [];
    for (const refactor of responseApplicable.body) {
        for (const action of refactor.actions) {
            actions.push({
                refactorName: refactor.name,
                refactorDescription: refactor.description,
                actionName: action.name,
                actionDescription: action.description,
                inlineable: refactor.inlineable !== undefined ? refactor.inlineable : true,
            });
        }
    }
    return actions;
}
async function getApplicabeRefactors(client, pointOrRange) {
    try {
        return await client.execute("getApplicableRefactors", pointOrRange);
    }
    catch (_a) {
        return undefined;
    }
}
async function applyRefactors(selectedAction, range, client, deps) {
    const responseEdits = await client.execute("getEditsForRefactor", Object.assign({}, range, { refactor: selectedAction.refactorName, action: selectedAction.actionName }));
    if (responseEdits.body === undefined)
        return;
    const { edits, renameFilename, renameLocation } = responseEdits.body;
    await deps.applyEdits(edits);
    if (renameFilename === undefined || renameLocation === undefined)
        return;
    const editor = await atom.workspace.open(renameFilename, {
        searchAllPanes: true,
        initialLine: renameLocation.line - 1,
        initialColumn: renameLocation.offset - 1,
    });
    await atom.commands.dispatch(atom.views.getView(editor), "typescript:rename-refactor");
}
//# sourceMappingURL=refactorCode.js.map