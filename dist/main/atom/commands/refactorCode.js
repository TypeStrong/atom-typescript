"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const etch = require("etch");
const highlightComponent_1 = require("../views/highlightComponent");
registry_1.addCommand("atom-text-editor", "typescript:refactor-code", deps => ({
    description: "Get a list of applicable refactors",
    async didDispatch(e) {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const editor = e.currentTarget.getModel();
        const location = utils_1.getFilePathPosition(editor);
        if (!location) {
            e.abortKeyBinding();
            return;
        }
        const selection = editor.getSelectedBufferRange();
        if (selection.isEmpty()) {
            e.abortKeyBinding();
            return;
        }
        const client = await deps.getClient(location.file);
        const fileRange = {
            file: location.file,
            startLine: selection.start.row + 1,
            startOffset: selection.start.column + 1,
            endLine: selection.end.row + 1,
            endOffset: selection.end.column + 1,
        };
        const actions = await getApplicableRefactorsActions(client, fileRange);
        if (actions.length === 0) {
            // TODO Show a "no applicable refactors here" message
            e.abortKeyBinding();
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
        if (selectedAction !== undefined) {
            await applyRefactors(selectedAction, fileRange, client, deps, editor, e);
            // TODO responseEdits could have renameFilename and renameLocation properties
            // so we can call a rename command.
        }
    },
}));
async function getApplicableRefactorsActions(client, range) {
    const responseApplicable = await client.execute("getApplicableRefactors", range);
    if (responseApplicable.body === undefined || responseApplicable.body.length === 0) {
        return [];
    }
    const actions = [];
    responseApplicable.body.forEach(refactor => {
        refactor.actions.forEach(action => {
            actions.push({
                refactorName: refactor.name,
                refactorDescription: refactor.description,
                actionName: action.name,
                actionDescription: action.description,
                inlineable: refactor.inlineable !== undefined ? refactor.inlineable : true,
            });
        });
    });
    return actions;
}
async function applyRefactors(selectedAction, range, client, deps, editor, e) {
    const responseEdits = await client.execute("getEditsForRefactor", Object.assign({}, range, { refactor: selectedAction.refactorName, action: selectedAction.actionName }));
    if (responseEdits.body === undefined) {
        e.abortKeyBinding();
        return;
    }
    for (const edit of responseEdits.body.edits) {
        await deps.withTypescriptBuffer(edit.fileName, async (buffer) => {
            buffer.buffer.transact(() => {
                for (const change of edit.textChanges.reverse()) {
                    editor.setTextInBufferRange(utils_1.spanToRange(change), change.newText);
                }
            });
        });
    }
}
//# sourceMappingURL=refactorCode.js.map