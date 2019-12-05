"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
async function renderTooltip(data, etch, codeRenderer) {
    if (data === undefined)
        return null;
    const codeText = data.displayString.replace(/^\(.+?\)\s+/, "");
    const code = codeRenderer ? (await codeRenderer(codeText)) : (etch.dom("div", { className: "atom-typescript-tooltip-tooltip-code" }, codeText));
    const kind = (etch.dom("div", { className: "atom-typescript-datatip-tooltip-kind" },
        data.kind,
        data.kindModifiers ? etch.dom("i", null,
            " (",
            data.kindModifiers,
            ")") : null));
    const tags = data.tags.map(tag => {
        const tagClass = `atom-typescript-datatip-tooltip-doc-tag ` +
            `atom-typescript-datatip-tooltip-doc-tag-name-${tag.name}`;
        const tagText = formatTagText(etch, tag.text);
        return (etch.dom("div", { className: tagClass },
            etch.dom("span", { className: "atom-typescript-datatip-tooltip-doc-tag-name" }, tag.name),
            " ",
            tagText));
    });
    const docs = (etch.dom("div", { className: "atom-typescript-datatip-tooltip-doc" },
        data.documentation,
        tags));
    return [code, kind, docs];
}
exports.renderTooltip = renderTooltip;
function formatTagText(etch, tagText) {
    if (tagText === undefined)
        return null;
    const [, firstWord, restOfText] = /^\s*(\S*)(.*)$/.exec(tagText);
    return (etch.dom("span", { className: "atom-typescript-datatip-tooltip-doc-tag-text" },
        etch.dom("span", { className: "atom-typescript-datatip-tooltip-doc-tag-text-first-word" }, firstWord),
        restOfText));
}
//# sourceMappingURL=tooltipRenderer.js.map