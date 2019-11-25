"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function renderTooltip(data, etch) {
    const kind = (etch.dom("div", { className: "atom-typescript-datatip-tooltip-kind" },
        data.kind,
        data.kindModifiers ? etch.dom("i", null,
            " (",
            data.kindModifiers,
            ")") : null));
    const tags = data.tags.map(tag => {
        const tagClass = `atom-typescript-datatip-tooltip-doc-tag ` +
            `atom-typescript-datatip-tooltip-doc-tag-name-${tag.name}`;
        let tagText = null;
        if (tag.text !== undefined) {
            const firstWord = tag.text.replace(/\s(.*)/, "");
            const restOfText = tag.text.replace(/([^\s]+)/, "");
            tagText = (etch.dom("span", { className: "atom-typescript-datatip-tooltip-doc-tag-text" },
                etch.dom("span", { className: "atom-typescript-datatip-tooltip-doc-tag-text-first-word" }, firstWord),
                " ",
                restOfText));
        }
        return (etch.dom("div", { className: tagClass },
            etch.dom("span", { className: "atom-typescript-datatip-tooltip-doc-tag-name" }, tag.name),
            " ",
            tagText));
    });
    const docs = (etch.dom("div", { className: "atom-typescript-datatip-tooltip-doc" },
        data.documentation,
        tags));
    return [kind, docs];
}
exports.renderTooltip = renderTooltip;
//# sourceMappingURL=tooltipRenderer.js.map