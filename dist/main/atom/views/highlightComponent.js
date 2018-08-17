"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const fuzzaldrin_1 = require("fuzzaldrin");
class HighlightComponent {
    constructor(props) {
        this.props = props;
        this.matches = this.match(this.props);
        etch.initialize(this);
    }
    async update(props) {
        this.props = Object.assign({}, this.props, props);
        this.matches = this.match(this.props);
        await etch.update(this);
    }
    async destroy() {
        await etch.destroy(this);
    }
    render() {
        return (etch.dom("span", null, this.matches.map(m => (etch.dom("span", { class: m.type }, m.text)))));
    }
    match(props) {
        if (props.query) {
            return highlightMatches(props.label, props.query);
        }
        return [{ text: props.label }];
    }
}
exports.HighlightComponent = HighlightComponent;
// extracted/adapted from symbols-view package (symbols-view.js::SymbolsView.highlightMatches)
function highlightMatches(name, query) {
    let lastIndex = 0;
    let matchedChars = []; // Build up a set of matched chars to be more semantic
    const queryMatches = [];
    const matches = fuzzaldrin_1.match(name, query);
    let matchIndex;
    for (matchIndex of matches) {
        if (matchIndex < 0) {
            continue; // If marking up the basename, omit name matches
        }
        const unmatched = name.substring(lastIndex, matchIndex);
        if (unmatched) {
            if (matchedChars.length > 0) {
                queryMatches.push({ text: matchedChars.join(""), type: "character-match" });
            }
            matchedChars = [];
            queryMatches.push({ text: unmatched });
        }
        matchedChars.push(name[matchIndex]);
        lastIndex = matchIndex + 1;
    }
    if (matchedChars.length > 0) {
        queryMatches.push({ text: matchedChars.join(""), type: "character-match" });
    }
    // Remaining characters are plain text
    queryMatches.push({ text: name.substring(lastIndex) });
    return queryMatches;
}
exports.highlightMatches = highlightMatches;
//# sourceMappingURL=highlightComponent.js.map