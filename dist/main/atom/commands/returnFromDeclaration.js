"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./registry");
registry_1.addCommand("atom-workspace", "typescript:return-from-declaration", deps => ({
    description: "If used `go-to-declaration`, return to previous text cursor position",
    async didDispatch() {
        deps.getEditorPositionHistoryManager().goBack();
    },
}));
//# sourceMappingURL=returnFromDeclaration.js.map