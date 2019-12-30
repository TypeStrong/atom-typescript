"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function renderTooltip(data, etch, codeRenderer) {
    if (data === undefined)
        return null;
    const kind = (etch.dom("div", { className: "atom-typescript-datatip-tooltip-kind" },
        data.kind,
        formatKindModifiers(data.kindModifiers)));
    // tslint:disable-next-line: strict-boolean-expressions // TODO: complain on TS
    const tags = data.tags
        ? data.tags.map(tag => {
            const tagClass = "atom-typescript-datatip-tooltip-doc-tag " +
                `atom-typescript-datatip-tooltip-doc-tag-name-${tag.name}`;
            return (etch.dom("div", { className: tagClass },
                etch.dom("span", { className: "atom-typescript-datatip-tooltip-doc-tag-name" }, tag.name),
                formatTagText(etch, tag.text)));
        })
        : null;
    const docs = (etch.dom("div", { className: "atom-typescript-datatip-tooltip-doc" },
        data.documentation,
        tags));
    const codeText = data.displayString.replace(/^\(.+?\)\s+/, "");
    return [await codeRenderer(codeText), kind, docs];
}
exports.renderTooltip = renderTooltip;
function formatKindModifiers(etch, text) {
    if (text === undefined)
        return null;
    return etch.dom("span", { className: "atom-typescript-datatip-tooltip-kind-modifiers" }, text);
}
function formatTagText(etch, tagText) {
    if (tagText === undefined)
        return null;
    const [, firstWord, restOfText] = /^\s*(\S*)([^]*)$/.exec(tagText);
    return (etch.dom("span", { className: "atom-typescript-datatip-tooltip-doc-tag-text" },
        etch.dom("span", { className: "atom-typescript-datatip-tooltip-doc-tag-text-first-word" }, firstWord),
        restOfText));
}
//# sourceMappingURL=tooltipRenderer.js.map