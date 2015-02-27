var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ts = require('typescript');
var TokenClass = ts.TokenClass;
var atom$ = require('atom').$;
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
        this.classifier = ts.createClassifier({ log: function () { return undefined; } });
        this.fullTripleSlashReferencePathRegEx = /^(\/\/\/\s*<reference\s+path\s*=\s*)('|")(.+?)\2.*?\/>/;
        this.importRequireRegex = /^import\s*(\w*)\s*=\s*require\((?:'|")(\S*)(?:'|")\.*\)/;
    }
    TypeScriptSemanticGrammar.prototype.tokenizeLine = function (line, ruleStack, firstLine) {
        if (firstLine === void 0) { firstLine = false; }
        var finalLexState = firstLine ? ts.EndOfLineState.Start : ruleStack.length ? ruleStack[0] : ts.EndOfLineState.Start;
        if (finalLexState !== ts.EndOfLineState.Start) {
            return this.getAtomTokensForLine(line, finalLexState);
        }
        if (line.match(this.fullTripleSlashReferencePathRegEx)) {
            return this.getfullTripleSlashReferencePathTokensForLine(line);
        }
        else if (line.match(this.importRequireRegex)) {
            return this.getImportRequireTokensForLine(line);
        }
        else {
            return this.getAtomTokensForLine(line, finalLexState);
        }
    };
    TypeScriptSemanticGrammar.prototype.getfullTripleSlashReferencePathTokensForLine = function (line) {
        return this.getAtomTokensForLine(line, ts.EndOfLineState.Start);
        return { tokens: [this.registry.createToken(line, ["source.ts", "keyword.using.reference"])], ruleStack: [] };
    };
    TypeScriptSemanticGrammar.prototype.getImportRequireTokensForLine = function (line) {
        return this.getAtomTokensForLine(line, ts.EndOfLineState.Start);
        return { tokens: [this.registry.createToken(line, ["source.ts", "keyword.using.import"])], ruleStack: [] };
    };
    TypeScriptSemanticGrammar.prototype.getTsTokensForLine = function (line, finalLexState) {
        var output = this.classifier.getClassificationsForLine(line, finalLexState, true);
        var ruleStack = [output.finalLexState];
        var classificationResults = output.entries;
        if (!classificationResults.length)
            return { tokens: [{ style: '', str: '' }], ruleStack: ruleStack };
        var totalLength = 0;
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
        var _this = this;
        var tsTokensWithRuleStack = this.getTsTokensForLine(line, finalLexState);
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
            return 'punctuation';
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
            if (!str.trim())
                return '';
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
