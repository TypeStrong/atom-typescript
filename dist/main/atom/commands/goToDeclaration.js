"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
const utils_1 = require("../utils");
const simpleSelectionView_1 = require("../views/simpleSelectionView");
const etch = require("etch");
const prevCursorPositions = [];
async function open(item) {
    const editor = await atom.workspace.open(item.file, {
        initialLine: item.start.line - 1,
        initialColumn: item.start.offset - 1,
    });
    if (atom.workspace.isTextEditor(editor)) {
        editor.scrollToCursorPosition({ center: true });
    }
}
registry_1.commands.set("typescript:go-to-declaration", deps => {
    return async (e) => {
        if (!utils_1.commandForTypeScript(e)) {
            return;
        }
        const location = utils_1.getFilePathPosition();
        if (!location) {
            e.abortKeyBinding();
            return;
        }
        const client = await deps.getClient(location.file);
        const result = await client.executeDefinition(location);
        handleDefinitionResult(result, location);
    };
});
registry_1.commands.set("typescript:return-from-declaration", () => {
    return async () => {
        const position = prevCursorPositions.pop();
        if (!position) {
            atom.notifications.addInfo("AtomTS: Previous position not found.");
            return;
        }
        open({
            file: position.file,
            start: { line: position.line, offset: position.offset },
        });
    };
});
async function handleDefinitionResult(result, location) {
    if (!result.body) {
        return;
    }
    else if (result.body.length > 1) {
        const res = await simpleSelectionView_1.selectListView({
            items: result.body,
            itemTemplate: item => {
                return (etch.dom("div", null,
                    etch.dom("span", null, item.file),
                    etch.dom("div", { class: "pull-right" },
                        "line: ",
                        item.start.line)));
            },
            itemFilterKey: "file",
        });
        if (res) {
            prevCursorPositions.push(location);
            open(res);
        }
    }
    else if (result.body.length) {
        prevCursorPositions.push(location);
        open(result.body[0]);
    }
}
exports.handleDefinitionResult = handleDefinitionResult;
//# sourceMappingURL=goToDeclaration.js.map