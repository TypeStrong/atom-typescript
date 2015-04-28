// Help:
// https://github.com/atom/first-mate/
// https://github.com/fdecampredon/brackets-typescript/blob/master/src/main/mode.ts
// https://github.com/p-e-w/language-javascript-semantic/blob/master/lib/javascript-semantic-grammar.coffee
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TokenClass = ts.TokenClass;
global.AtomTSBaseGrammar = require(atom.config.resourcePath + "/node_modules/first-mate/lib/grammar.js");
var TypeScriptSemanticGrammar = (function (_super) {
    __extends(TypeScriptSemanticGrammar, _super);
    function TypeScriptSemanticGrammar(registry) {
        _super.call(this, registry, {
            name: "TypeScript",
            scopeName: "source.ts",
            patterns: {},
            fileTypes: ['ts']
        });
        this.registry = registry;
        this.trailingWhiteSpaceLength = 0;
        this.classifier = ts.createClassifier();
        this.fullTripleSlashReferencePathRegEx = /^(\/\/\/\s*<reference\s+path\s*=\s*)('|")(.+?)\2.*?\/>/;
        this.importRequireRegex = /^import\s*(\w*)\s*=\s*require\((?:'|")(\S*)(?:'|")\.*\)/;
        this.es6importRegex = /^import.*from.*/;
    }
    TypeScriptSemanticGrammar.prototype.tokenizeLine = function (line, ruleStack, firstLine) {
        if (firstLine === void 0) { firstLine = false; }
        if (firstLine
            && line.length > 1
            && (line.charCodeAt(0) == 0xFFFE || line.charCodeAt(0) == 0xFEFF)) {
            this.trailingWhiteSpaceLength = 1;
        }
        else {
            this.trailingWhiteSpaceLength = 0;
        }
        var finalLexState = firstLine ? 0
            : ruleStack.length ? ruleStack[0]
                : 0;
        if (finalLexState !== 0) {
            return this.getAtomTokensForLine(line, finalLexState);
        }
        if (line.match(this.fullTripleSlashReferencePathRegEx)) {
            return this.getfullTripleSlashReferencePathTokensForLine(line);
        }
        else if (line.match(this.importRequireRegex)) {
            return this.getImportRequireTokensForLine(line);
        }
        else if (line.match(this.es6importRegex)) {
            return this.getEs6importTokensForLine(line);
        }
        else {
            return this.getAtomTokensForLine(line, finalLexState);
        }
    };
    TypeScriptSemanticGrammar.prototype.getfullTripleSlashReferencePathTokensForLine = function (line) {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line);
        var matches = line.match(this.fullTripleSlashReferencePathRegEx);
        if (matches[3]) {
            var path = matches[3];
            if (line.indexOf('"' + path + '"') != -1) {
                path = '"' + path + '"';
            }
            else {
                path = "'" + path + "'";
            }
            var startPosition = line.indexOf(path);
            var endPosition = startPosition + path.length;
            var atomTokens = [];
            atomTokens.push(this.registry.createToken(line.substr(0, startPosition), ['source.ts', 'keyword']));
            atomTokens.push(this.registry.createToken(line.substr(startPosition, path.length), ['source.ts', 'reference.path.string']));
            atomTokens.push(this.registry.createToken(line.substr(endPosition, line.length - endPosition), ['source.ts', 'keyword']));
            return { tokens: atomTokens, ruleStack: [] };
        }
        else {
            return this.convertTsTokensToAtomTokens(tsTokensWithRuleStack);
        }
    };
    TypeScriptSemanticGrammar.prototype.getImportRequireTokensForLine = function (line) {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line);
        tsTokensWithRuleStack.tokens.forEach(function (t) {
            if (t.style == "identifier") {
                t.style = "require.identifier";
            }
            if (t.style == "string") {
                t.style = "require.path.string";
            }
        });
        return this.convertTsTokensToAtomTokens(tsTokensWithRuleStack);
    };
    TypeScriptSemanticGrammar.prototype.getEs6importTokensForLine = function (line) {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line);
        tsTokensWithRuleStack.tokens.forEach(function (t) {
            if (t.style == "identifier") {
                t.style = "es6import.identifier";
            }
            if (t.style == "string") {
                t.style = "es6import.path.string";
            }
        });
        return this.convertTsTokensToAtomTokens(tsTokensWithRuleStack);
    };
    TypeScriptSemanticGrammar.prototype.getTsTokensForLine = function (line, finalLexState) {
        if (finalLexState === void 0) { finalLexState = 0; }
        var output = this.classifier.getClassificationsForLine(line, finalLexState, true);
        var ruleStack = [output.finalLexState];
        var classificationResults = output.entries;
        if (!classificationResults.length)
            return { tokens: [{ style: 'whitespace', str: '' }], ruleStack: ruleStack };
        var totalLength = this.trailingWhiteSpaceLength;
        var tokens = classificationResults.map(function (info) {
            var tokenStartPosition = totalLength;
            var str = line.substr(tokenStartPosition, info.length);
            totalLength = totalLength + info.length;
            var style = getAtomStyleForToken(info, str);
            return { style: style, str: str };
        });
        return { tokens: tokens, ruleStack: ruleStack };
    };
    TypeScriptSemanticGrammar.prototype.getAtomTokensForLine = function (line, finalLexState) {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line, finalLexState);
        return this.convertTsTokensToAtomTokens(tsTokensWithRuleStack);
    };
    TypeScriptSemanticGrammar.prototype.convertTsTokensToAtomTokens = function (tsTokensWithRuleStack) {
        var _this = this;
        var tokens = tsTokensWithRuleStack.tokens.map(function (info) {
            var atomToken = _this.registry.createToken(info.str, ["source.ts", info.style]);
            return atomToken;
        });
        return { tokens: tokens, ruleStack: tsTokensWithRuleStack.ruleStack };
    };
    return TypeScriptSemanticGrammar;
})(AtomTSBaseGrammar);
exports.TypeScriptSemanticGrammar = TypeScriptSemanticGrammar;
function getAtomStyleForToken(token, str) {
    switch (token.classification) {
        case TokenClass.Punctuation:
            switch (str) {
                case '{':
                    return "punctuation.section.scope.begin.ts";
                case '}':
                    return "punctuation.section.scope.end.ts";
                case ')':
                    return "meta.brace.round.ts";
                case '(':
                    return "meta.brace.round.ts";
                case ';':
                    return "punctuation.terminator.statement.ts";
                default:
                    return "punctuation";
            }
        case TokenClass.Keyword:
            switch (str) {
                case 'static':
                case 'public':
                case 'private':
                case 'export':
                case 'get':
                case 'set':
                    return 'support.function';
                case 'class':
                case 'module':
                case 'var':
                    return 'storage.modifier';
                case 'function':
                    return 'storage.type.function';
                case 'string':
                case 'number':
                case 'void':
                case 'boolean':
                    return 'keyword';
                default:
                    return 'keyword';
            }
        case TokenClass.Operator:
            return 'keyword.operator.js';
        case TokenClass.Comment:
            return 'comment';
        case TokenClass.Whitespace:
            return 'whitespace';
        case TokenClass.Identifier:
            return 'identifier';
        case TokenClass.NumberLiteral:
            return 'constant.numeric';
        case TokenClass.StringLiteral:
            return 'string';
        case TokenClass.RegExpLiteral:
            return 'constant.character';
        default:
            return null;
    }
}
