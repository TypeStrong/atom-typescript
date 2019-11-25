"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Atom = require("atom");
const tooltipRenderer_1 = require("../atom/tooltips/tooltipRenderer");
const utils_1 = require("../atom/utils");
// Note: a horrible hack to avoid dependency on React
const REACT_ELEMENT_SYMBOL = Symbol.for("react.element");
const etch = {
    dom(type, props, ...children) {
        if (children.length > 0) {
            return {
                $$typeof: REACT_ELEMENT_SYMBOL,
                type,
                ref: null,
                props: Object.assign(Object.assign({}, props), { children }),
            };
        }
        else {
            return {
                $$typeof: REACT_ELEMENT_SYMBOL,
                type,
                ref: null,
                props: Object.assign({}, props),
            };
        }
    },
};
class TSDatatipProvider {
    constructor(getClient) {
        this.getClient = getClient;
        this.providerName = "TypeScript type tooltips";
        this.priority = 100;
        this.grammarScopes = utils_1.typeScriptScopes();
    }
    async datatip(editor, bufferPt) {
        try {
            const filePath = editor.getPath();
            if (filePath === undefined)
                return;
            const client = await this.getClient(filePath);
            const result = await client.execute("quickinfo", {
                file: filePath,
                line: bufferPt.row + 1,
                offset: bufferPt.column + 1,
            });
            const data = result.body;
            const code = await highlightCode(data.displayString.replace(/^\(.+?\)\s+/, ""));
            const [kind, docs] = tooltipRenderer_1.renderTooltip(data, etch);
            return {
                component: () => (etch.dom("div", { className: "atom-typescript-datatip-tooltip" },
                    code,
                    kind,
                    docs)),
                range: Atom.Range.fromObject([utils_1.locationToPoint(data.start), utils_1.locationToPoint(data.end)]),
            };
        }
        catch (e) {
            return;
        }
    }
}
exports.TSDatatipProvider = TSDatatipProvider;
async function highlightCode(code) {
    const fontFamily = atom.config.get("editor.fontFamily");
    const ed = new Atom.TextEditor({
        readonly: true,
        keyboardInputEnabled: false,
        showInvisibles: false,
        tabLength: atom.config.get("editor.tabLength"),
    });
    const el = atom.views.getView(ed);
    try {
        el.setUpdatedSynchronously(true);
        el.style.pointerEvents = "none";
        el.style.position = "absolute";
        el.style.width = "0px";
        el.style.height = "1px";
        atom.views.getView(atom.workspace).appendChild(el);
        atom.grammars.assignLanguageMode(ed.getBuffer(), "source.ts");
        ed.setText(code.replace(/\r?\n$/, ""));
        await editorTokenized(ed);
        const html = Array.from(el.querySelectorAll(".line:not(.dummy)"));
        return (etch.dom("div", { style: { fontFamily }, className: "atom-typescript-datatip-tooltip-code", dangerouslySetInnerHTML: { __html: html.map(x => x.innerHTML).join("\n") } }));
    }
    finally {
        el.remove();
    }
}
async function editorTokenized(editor) {
    return new Promise(resolve => {
        if (editor.getBuffer().getLanguageMode().fullyTokenized) {
            resolve();
        }
        else {
            const disp = editor.onDidTokenize(() => {
                disp.dispose();
                resolve();
            });
        }
    });
}
//# sourceMappingURL=datatipProvider.js.map