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
            const tooltip = await tooltipRenderer_1.renderTooltip(data, etch, highlightCode);
            return {
                component: () => etch.dom("div", { className: "atom-typescript-datatip-tooltip" }, tooltip),
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
    const html = await utils_1.highlight(code.replace(/\r?\n$/, ""), "source.ts");
    return (etch.dom("div", { style: { fontFamily }, className: "atom-typescript-datatip-tooltip-code", dangerouslySetInnerHTML: { __html: html.join("\n") } }));
}
//# sourceMappingURL=datatipProvider.js.map