/// <reference path="scanner.ts"/>
/// <reference path="utilities.ts"/>
var ts;
(function (ts) {
    var nodeConstructors = new Array(229);
    ts.parseTime = 0;
    function getNodeConstructor(kind) {
        return nodeConstructors[kind] || (nodeConstructors[kind] = ts.objectAllocator.getNodeConstructor(kind));
    }
    ts.getNodeConstructor = getNodeConstructor;
    function createNode(kind) {
        return new (getNodeConstructor(kind))();
    }
    ts.createNode = createNode;
    function visitNode(cbNode, node) {
        if (node) {
            return cbNode(node);
        }
    }
    function visitNodeArray(cbNodes, nodes) {
        if (nodes) {
            return cbNodes(nodes);
        }
    }
    function visitEachNode(cbNode, nodes) {
        if (nodes) {
            for (var _i = 0; _i < nodes.length; _i++) {
                var node = nodes[_i];
                var result = cbNode(node);
                if (result) {
                    return result;
                }
            }
        }
    }
    function forEachChild(node, cbNode, cbNodeArray) {
        if (!node) {
            return;
        }
        var visitNodes = cbNodeArray ? visitNodeArray : visitEachNode;
        var cbNodes = cbNodeArray || cbNode;
        switch (node.kind) {
            case 126:
                return visitNode(cbNode, node.left) ||
                    visitNode(cbNode, node.right);
            case 128:
                return visitNode(cbNode, node.name) ||
                    visitNode(cbNode, node.constraint) ||
                    visitNode(cbNode, node.expression);
            case 129:
            case 132:
            case 131:
            case 224:
            case 225:
            case 198:
            case 152:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.propertyName) ||
                    visitNode(cbNode, node.dotDotDotToken) ||
                    visitNode(cbNode, node.name) ||
                    visitNode(cbNode, node.questionToken) ||
                    visitNode(cbNode, node.type) ||
                    visitNode(cbNode, node.initializer);
            case 142:
            case 143:
            case 138:
            case 139:
            case 140:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNodes(cbNodes, node.typeParameters) ||
                    visitNodes(cbNodes, node.parameters) ||
                    visitNode(cbNode, node.type);
            case 134:
            case 133:
            case 135:
            case 136:
            case 137:
            case 162:
            case 200:
            case 163:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.asteriskToken) ||
                    visitNode(cbNode, node.name) ||
                    visitNode(cbNode, node.questionToken) ||
                    visitNodes(cbNodes, node.typeParameters) ||
                    visitNodes(cbNodes, node.parameters) ||
                    visitNode(cbNode, node.type) ||
                    visitNode(cbNode, node.equalsGreaterThanToken) ||
                    visitNode(cbNode, node.body);
            case 141:
                return visitNode(cbNode, node.typeName) ||
                    visitNodes(cbNodes, node.typeArguments);
            case 144:
                return visitNode(cbNode, node.exprName);
            case 145:
                return visitNodes(cbNodes, node.members);
            case 146:
                return visitNode(cbNode, node.elementType);
            case 147:
                return visitNodes(cbNodes, node.elementTypes);
            case 148:
                return visitNodes(cbNodes, node.types);
            case 149:
                return visitNode(cbNode, node.type);
            case 150:
            case 151:
                return visitNodes(cbNodes, node.elements);
            case 153:
                return visitNodes(cbNodes, node.elements);
            case 154:
                return visitNodes(cbNodes, node.properties);
            case 155:
                return visitNode(cbNode, node.expression) ||
                    visitNode(cbNode, node.dotToken) ||
                    visitNode(cbNode, node.name);
            case 156:
                return visitNode(cbNode, node.expression) ||
                    visitNode(cbNode, node.argumentExpression);
            case 157:
            case 158:
                return visitNode(cbNode, node.expression) ||
                    visitNodes(cbNodes, node.typeArguments) ||
                    visitNodes(cbNodes, node.arguments);
            case 159:
                return visitNode(cbNode, node.tag) ||
                    visitNode(cbNode, node.template);
            case 160:
                return visitNode(cbNode, node.type) ||
                    visitNode(cbNode, node.expression);
            case 161:
                return visitNode(cbNode, node.expression);
            case 164:
                return visitNode(cbNode, node.expression);
            case 165:
                return visitNode(cbNode, node.expression);
            case 166:
                return visitNode(cbNode, node.expression);
            case 167:
                return visitNode(cbNode, node.operand);
            case 172:
                return visitNode(cbNode, node.asteriskToken) ||
                    visitNode(cbNode, node.expression);
            case 168:
                return visitNode(cbNode, node.operand);
            case 169:
                return visitNode(cbNode, node.left) ||
                    visitNode(cbNode, node.operatorToken) ||
                    visitNode(cbNode, node.right);
            case 170:
                return visitNode(cbNode, node.condition) ||
                    visitNode(cbNode, node.questionToken) ||
                    visitNode(cbNode, node.whenTrue) ||
                    visitNode(cbNode, node.colonToken) ||
                    visitNode(cbNode, node.whenFalse);
            case 173:
                return visitNode(cbNode, node.expression);
            case 179:
            case 206:
                return visitNodes(cbNodes, node.statements);
            case 227:
                return visitNodes(cbNodes, node.statements) ||
                    visitNode(cbNode, node.endOfFileToken);
            case 180:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.declarationList);
            case 199:
                return visitNodes(cbNodes, node.declarations);
            case 182:
                return visitNode(cbNode, node.expression);
            case 183:
                return visitNode(cbNode, node.expression) ||
                    visitNode(cbNode, node.thenStatement) ||
                    visitNode(cbNode, node.elseStatement);
            case 184:
                return visitNode(cbNode, node.statement) ||
                    visitNode(cbNode, node.expression);
            case 185:
                return visitNode(cbNode, node.expression) ||
                    visitNode(cbNode, node.statement);
            case 186:
                return visitNode(cbNode, node.initializer) ||
                    visitNode(cbNode, node.condition) ||
                    visitNode(cbNode, node.incrementor) ||
                    visitNode(cbNode, node.statement);
            case 187:
                return visitNode(cbNode, node.initializer) ||
                    visitNode(cbNode, node.expression) ||
                    visitNode(cbNode, node.statement);
            case 188:
                return visitNode(cbNode, node.initializer) ||
                    visitNode(cbNode, node.expression) ||
                    visitNode(cbNode, node.statement);
            case 189:
            case 190:
                return visitNode(cbNode, node.label);
            case 191:
                return visitNode(cbNode, node.expression);
            case 192:
                return visitNode(cbNode, node.expression) ||
                    visitNode(cbNode, node.statement);
            case 193:
                return visitNode(cbNode, node.expression) ||
                    visitNode(cbNode, node.caseBlock);
            case 207:
                return visitNodes(cbNodes, node.clauses);
            case 220:
                return visitNode(cbNode, node.expression) ||
                    visitNodes(cbNodes, node.statements);
            case 221:
                return visitNodes(cbNodes, node.statements);
            case 194:
                return visitNode(cbNode, node.label) ||
                    visitNode(cbNode, node.statement);
            case 195:
                return visitNode(cbNode, node.expression);
            case 196:
                return visitNode(cbNode, node.tryBlock) ||
                    visitNode(cbNode, node.catchClause) ||
                    visitNode(cbNode, node.finallyBlock);
            case 223:
                return visitNode(cbNode, node.variableDeclaration) ||
                    visitNode(cbNode, node.block);
            case 130:
                return visitNode(cbNode, node.expression);
            case 201:
            case 174:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.name) ||
                    visitNodes(cbNodes, node.typeParameters) ||
                    visitNodes(cbNodes, node.heritageClauses) ||
                    visitNodes(cbNodes, node.members);
            case 202:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.name) ||
                    visitNodes(cbNodes, node.typeParameters) ||
                    visitNodes(cbNodes, node.heritageClauses) ||
                    visitNodes(cbNodes, node.members);
            case 203:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.name) ||
                    visitNode(cbNode, node.type);
            case 204:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.name) ||
                    visitNodes(cbNodes, node.members);
            case 226:
                return visitNode(cbNode, node.name) ||
                    visitNode(cbNode, node.initializer);
            case 205:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.name) ||
                    visitNode(cbNode, node.body);
            case 208:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.name) ||
                    visitNode(cbNode, node.moduleReference);
            case 209:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.importClause) ||
                    visitNode(cbNode, node.moduleSpecifier);
            case 210:
                return visitNode(cbNode, node.name) ||
                    visitNode(cbNode, node.namedBindings);
            case 211:
                return visitNode(cbNode, node.name);
            case 212:
            case 216:
                return visitNodes(cbNodes, node.elements);
            case 215:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.exportClause) ||
                    visitNode(cbNode, node.moduleSpecifier);
            case 213:
            case 217:
                return visitNode(cbNode, node.propertyName) ||
                    visitNode(cbNode, node.name);
            case 214:
                return visitNodes(cbNodes, node.decorators) ||
                    visitNodes(cbNodes, node.modifiers) ||
                    visitNode(cbNode, node.expression);
            case 171:
                return visitNode(cbNode, node.head) || visitNodes(cbNodes, node.templateSpans);
            case 176:
                return visitNode(cbNode, node.expression) || visitNode(cbNode, node.literal);
            case 127:
                return visitNode(cbNode, node.expression);
            case 222:
                return visitNodes(cbNodes, node.types);
            case 177:
                return visitNode(cbNode, node.expression) ||
                    visitNodes(cbNodes, node.typeArguments);
            case 219:
                return visitNode(cbNode, node.expression);
            case 218:
                return visitNodes(cbNodes, node.decorators);
        }
    }
    ts.forEachChild = forEachChild;
    function createSourceFile(fileName, sourceText, languageVersion, setParentNodes) {
        if (setParentNodes === void 0) { setParentNodes = false; }
        var start = new Date().getTime();
        var result = Parser.parseSourceFile(fileName, sourceText, languageVersion, undefined, setParentNodes);
        ts.parseTime += new Date().getTime() - start;
        return result;
    }
    ts.createSourceFile = createSourceFile;
    function updateSourceFile(sourceFile, newText, textChangeRange, aggressiveChecks) {
        return IncrementalParser.updateSourceFile(sourceFile, newText, textChangeRange, aggressiveChecks);
    }
    ts.updateSourceFile = updateSourceFile;
    var Parser;
    (function (Parser) {
        var scanner = ts.createScanner(2, true);
        var disallowInAndDecoratorContext = 2 | 16;
        var sourceFile;
        var syntaxCursor;
        var token;
        var sourceText;
        var nodeCount;
        var identifiers;
        var identifierCount;
        var parsingContext;
        var contextFlags = 0;
        var parseErrorBeforeNextFinishedNode = false;
        function parseSourceFile(fileName, _sourceText, languageVersion, _syntaxCursor, setParentNodes) {
            sourceText = _sourceText;
            syntaxCursor = _syntaxCursor;
            parsingContext = 0;
            identifiers = {};
            identifierCount = 0;
            nodeCount = 0;
            contextFlags = 0;
            parseErrorBeforeNextFinishedNode = false;
            createSourceFile(fileName, languageVersion);
            scanner.setText(sourceText);
            scanner.setOnError(scanError);
            scanner.setScriptTarget(languageVersion);
            token = nextToken();
            processReferenceComments(sourceFile);
            sourceFile.statements = parseList(0, true, parseSourceElement);
            ts.Debug.assert(token === 1);
            sourceFile.endOfFileToken = parseTokenNode();
            setExternalModuleIndicator(sourceFile);
            sourceFile.nodeCount = nodeCount;
            sourceFile.identifierCount = identifierCount;
            sourceFile.identifiers = identifiers;
            if (setParentNodes) {
                fixupParentReferences(sourceFile);
            }
            syntaxCursor = undefined;
            scanner.setText("");
            scanner.setOnError(undefined);
            var result = sourceFile;
            sourceFile = undefined;
            identifiers = undefined;
            syntaxCursor = undefined;
            sourceText = undefined;
            return result;
        }
        Parser.parseSourceFile = parseSourceFile;
        function fixupParentReferences(sourceFile) {
            // normally parent references are set during binding. However, for clients that only need
            // a syntax tree, and no semantic features, then the binding process is an unnecessary
            // overhead.  This functions allows us to set all the parents, without all the expense of
            // binding.
            var parent = sourceFile;
            forEachChild(sourceFile, visitNode);
            return;
            function visitNode(n) {
                if (n.parent !== parent) {
                    n.parent = parent;
                    var saveParent = parent;
                    parent = n;
                    forEachChild(n, visitNode);
                    parent = saveParent;
                }
            }
        }
        function createSourceFile(fileName, languageVersion) {
            sourceFile = createNode(227, 0);
            sourceFile.pos = 0;
            sourceFile.end = sourceText.length;
            sourceFile.text = sourceText;
            sourceFile.parseDiagnostics = [];
            sourceFile.bindDiagnostics = [];
            sourceFile.languageVersion = languageVersion;
            sourceFile.fileName = ts.normalizePath(fileName);
            sourceFile.flags = ts.fileExtensionIs(sourceFile.fileName, ".d.ts") ? 2048 : 0;
        }
        function setContextFlag(val, flag) {
            if (val) {
                contextFlags |= flag;
            }
            else {
                contextFlags &= ~flag;
            }
        }
        function setStrictModeContext(val) {
            setContextFlag(val, 1);
        }
        function setDisallowInContext(val) {
            setContextFlag(val, 2);
        }
        function setYieldContext(val) {
            setContextFlag(val, 4);
        }
        function setGeneratorParameterContext(val) {
            setContextFlag(val, 8);
        }
        function setDecoratorContext(val) {
            setContextFlag(val, 16);
        }
        function doOutsideOfContext(flags, func) {
            var currentContextFlags = contextFlags & flags;
            if (currentContextFlags) {
                setContextFlag(false, currentContextFlags);
                var result = func();
                setContextFlag(true, currentContextFlags);
                return result;
            }
            return func();
        }
        function allowInAnd(func) {
            if (contextFlags & 2) {
                setDisallowInContext(false);
                var result = func();
                setDisallowInContext(true);
                return result;
            }
            return func();
        }
        function disallowInAnd(func) {
            if (contextFlags & 2) {
                return func();
            }
            setDisallowInContext(true);
            var result = func();
            setDisallowInContext(false);
            return result;
        }
        function doInYieldContext(func) {
            if (contextFlags & 4) {
                return func();
            }
            setYieldContext(true);
            var result = func();
            setYieldContext(false);
            return result;
        }
        function doOutsideOfYieldContext(func) {
            if (contextFlags & 4) {
                setYieldContext(false);
                var result = func();
                setYieldContext(true);
                return result;
            }
            return func();
        }
        function doInDecoratorContext(func) {
            if (contextFlags & 16) {
                return func();
            }
            setDecoratorContext(true);
            var result = func();
            setDecoratorContext(false);
            return result;
        }
        function inYieldContext() {
            return (contextFlags & 4) !== 0;
        }
        function inStrictModeContext() {
            return (contextFlags & 1) !== 0;
        }
        function inGeneratorParameterContext() {
            return (contextFlags & 8) !== 0;
        }
        function inDisallowInContext() {
            return (contextFlags & 2) !== 0;
        }
        function inDecoratorContext() {
            return (contextFlags & 16) !== 0;
        }
        function parseErrorAtCurrentToken(message, arg0) {
            var start = scanner.getTokenPos();
            var length = scanner.getTextPos() - start;
            parseErrorAtPosition(start, length, message, arg0);
        }
        function parseErrorAtPosition(start, length, message, arg0) {
            var lastError = ts.lastOrUndefined(sourceFile.parseDiagnostics);
            if (!lastError || start !== lastError.start) {
                sourceFile.parseDiagnostics.push(ts.createFileDiagnostic(sourceFile, start, length, message, arg0));
            }
            parseErrorBeforeNextFinishedNode = true;
        }
        function scanError(message, length) {
            var pos = scanner.getTextPos();
            parseErrorAtPosition(pos, length || 0, message);
        }
        function getNodePos() {
            return scanner.getStartPos();
        }
        function getNodeEnd() {
            return scanner.getStartPos();
        }
        function nextToken() {
            return token = scanner.scan();
        }
        function getTokenPos(pos) {
            return ts.skipTrivia(sourceText, pos);
        }
        function reScanGreaterToken() {
            return token = scanner.reScanGreaterToken();
        }
        function reScanSlashToken() {
            return token = scanner.reScanSlashToken();
        }
        function reScanTemplateToken() {
            return token = scanner.reScanTemplateToken();
        }
        function speculationHelper(callback, isLookAhead) {
            var saveToken = token;
            var saveParseDiagnosticsLength = sourceFile.parseDiagnostics.length;
            var saveParseErrorBeforeNextFinishedNode = parseErrorBeforeNextFinishedNode;
            var saveContextFlags = contextFlags;
            var result = isLookAhead
                ? scanner.lookAhead(callback)
                : scanner.tryScan(callback);
            ts.Debug.assert(saveContextFlags === contextFlags);
            if (!result || isLookAhead) {
                token = saveToken;
                sourceFile.parseDiagnostics.length = saveParseDiagnosticsLength;
                parseErrorBeforeNextFinishedNode = saveParseErrorBeforeNextFinishedNode;
            }
            return result;
        }
        function lookAhead(callback) {
            return speculationHelper(callback, true);
        }
        function tryParse(callback) {
            return speculationHelper(callback, false);
        }
        function isIdentifier() {
            if (token === 65) {
                return true;
            }
            if (token === 110 && inYieldContext()) {
                return false;
            }
            return token > 101;
        }
        function parseExpected(kind, diagnosticMessage) {
            if (token === kind) {
                nextToken();
                return true;
            }
            if (diagnosticMessage) {
                parseErrorAtCurrentToken(diagnosticMessage);
            }
            else {
                parseErrorAtCurrentToken(ts.Diagnostics._0_expected, ts.tokenToString(kind));
            }
            return false;
        }
        function parseOptional(t) {
            if (token === t) {
                nextToken();
                return true;
            }
            return false;
        }
        function parseOptionalToken(t) {
            if (token === t) {
                return parseTokenNode();
            }
            return undefined;
        }
        function parseExpectedToken(t, reportAtCurrentPosition, diagnosticMessage, arg0) {
            return parseOptionalToken(t) ||
                createMissingNode(t, reportAtCurrentPosition, diagnosticMessage, arg0);
        }
        function parseTokenNode() {
            var node = createNode(token);
            nextToken();
            return finishNode(node);
        }
        function canParseSemicolon() {
            if (token === 22) {
                return true;
            }
            return token === 15 || token === 1 || scanner.hasPrecedingLineBreak();
        }
        function parseSemicolon() {
            if (canParseSemicolon()) {
                if (token === 22) {
                    nextToken();
                }
                return true;
            }
            else {
                return parseExpected(22);
            }
        }
        function createNode(kind, pos) {
            nodeCount++;
            var node = new (nodeConstructors[kind] || (nodeConstructors[kind] = ts.objectAllocator.getNodeConstructor(kind)))();
            if (!(pos >= 0)) {
                pos = scanner.getStartPos();
            }
            node.pos = pos;
            node.end = pos;
            return node;
        }
        function finishNode(node) {
            node.end = scanner.getStartPos();
            if (contextFlags) {
                node.parserContextFlags = contextFlags;
            }
            if (parseErrorBeforeNextFinishedNode) {
                parseErrorBeforeNextFinishedNode = false;
                node.parserContextFlags |= 32;
            }
            return node;
        }
        function createMissingNode(kind, reportAtCurrentPosition, diagnosticMessage, arg0) {
            if (reportAtCurrentPosition) {
                parseErrorAtPosition(scanner.getStartPos(), 0, diagnosticMessage, arg0);
            }
            else {
                parseErrorAtCurrentToken(diagnosticMessage, arg0);
            }
            var result = createNode(kind, scanner.getStartPos());
            result.text = "";
            return finishNode(result);
        }
        function internIdentifier(text) {
            text = ts.escapeIdentifier(text);
            return ts.hasProperty(identifiers, text) ? identifiers[text] : (identifiers[text] = text);
        }
        function createIdentifier(isIdentifier, diagnosticMessage) {
            identifierCount++;
            if (isIdentifier) {
                var node = createNode(65);
                if (token !== 65) {
                    node.originalKeywordKind = token;
                }
                node.text = internIdentifier(scanner.getTokenValue());
                nextToken();
                return finishNode(node);
            }
            return createMissingNode(65, false, diagnosticMessage || ts.Diagnostics.Identifier_expected);
        }
        function parseIdentifier(diagnosticMessage) {
            return createIdentifier(isIdentifier(), diagnosticMessage);
        }
        function parseIdentifierName() {
            return createIdentifier(isIdentifierOrKeyword());
        }
        function isLiteralPropertyName() {
            return isIdentifierOrKeyword() ||
                token === 8 ||
                token === 7;
        }
        function parsePropertyName() {
            if (token === 8 || token === 7) {
                return parseLiteralNode(true);
            }
            if (token === 18) {
                return parseComputedPropertyName();
            }
            return parseIdentifierName();
        }
        function parseComputedPropertyName() {
            var node = createNode(127);
            parseExpected(18);
            var yieldContext = inYieldContext();
            if (inGeneratorParameterContext()) {
                setYieldContext(false);
            }
            node.expression = allowInAnd(parseExpression);
            if (inGeneratorParameterContext()) {
                setYieldContext(yieldContext);
            }
            parseExpected(19);
            return finishNode(node);
        }
        function parseContextualModifier(t) {
            return token === t && tryParse(nextTokenCanFollowModifier);
        }
        function nextTokenCanFollowModifier() {
            nextToken();
            return canFollowModifier();
        }
        function parseAnyContextualModifier() {
            return ts.isModifier(token) && tryParse(nextTokenCanFollowContextualModifier);
        }
        function nextTokenCanFollowContextualModifier() {
            if (token === 70) {
                return nextToken() === 77;
            }
            if (token === 78) {
                nextToken();
                if (token === 73) {
                    return lookAhead(nextTokenIsClassOrFunction);
                }
                return token !== 35 && token !== 14 && canFollowModifier();
            }
            if (token === 73) {
                return nextTokenIsClassOrFunction();
            }
            nextToken();
            return canFollowModifier();
        }
        function canFollowModifier() {
            return token === 18
                || token === 14
                || token === 35
                || isLiteralPropertyName();
        }
        function nextTokenIsClassOrFunction() {
            nextToken();
            return token === 69 || token === 83;
        }
        function isListElement(parsingContext, inErrorRecovery) {
            var node = currentNode(parsingContext);
            if (node) {
                return true;
            }
            switch (parsingContext) {
                case 0:
                case 1:
                    return isSourceElement(inErrorRecovery);
                case 2:
                case 4:
                    return isStartOfStatement(inErrorRecovery);
                case 3:
                    return token === 67 || token === 73;
                case 5:
                    return isStartOfTypeMember();
                case 6:
                    return lookAhead(isClassMemberStart) || (token === 22 && !inErrorRecovery);
                case 7:
                    return token === 18 || isLiteralPropertyName();
                case 13:
                    return token === 18 || token === 35 || isLiteralPropertyName();
                case 10:
                    return isLiteralPropertyName();
                case 8:
                    if (token === 14) {
                        return lookAhead(isValidHeritageClauseObjectLiteral);
                    }
                    if (!inErrorRecovery) {
                        return isStartOfLeftHandSideExpression() && !isHeritageClauseExtendsOrImplementsKeyword();
                    }
                    else {
                        return isIdentifier() && !isHeritageClauseExtendsOrImplementsKeyword();
                    }
                case 9:
                    return isIdentifierOrPattern();
                case 11:
                    return token === 23 || token === 21 || isIdentifierOrPattern();
                case 16:
                    return isIdentifier();
                case 12:
                case 14:
                    return token === 23 || token === 21 || isStartOfExpression();
                case 15:
                    return isStartOfParameter();
                case 17:
                case 18:
                    return token === 23 || isStartOfType();
                case 19:
                    return isHeritageClause();
                case 20:
                    return isIdentifierOrKeyword();
            }
            ts.Debug.fail("Non-exhaustive case in 'isListElement'.");
        }
        function isValidHeritageClauseObjectLiteral() {
            ts.Debug.assert(token === 14);
            if (nextToken() === 15) {
                var next = nextToken();
                return next === 23 || next === 14 || next === 79 || next === 102;
            }
            return true;
        }
        function nextTokenIsIdentifier() {
            nextToken();
            return isIdentifier();
        }
        function isHeritageClauseExtendsOrImplementsKeyword() {
            if (token === 102 ||
                token === 79) {
                return lookAhead(nextTokenIsStartOfExpression);
            }
            return false;
        }
        function nextTokenIsStartOfExpression() {
            nextToken();
            return isStartOfExpression();
        }
        function isListTerminator(kind) {
            if (token === 1) {
                return true;
            }
            switch (kind) {
                case 1:
                case 2:
                case 3:
                case 5:
                case 6:
                case 7:
                case 13:
                case 10:
                case 20:
                    return token === 15;
                case 4:
                    return token === 15 || token === 67 || token === 73;
                case 8:
                    return token === 14 || token === 79 || token === 102;
                case 9:
                    return isVariableDeclaratorListTerminator();
                case 16:
                    return token === 25 || token === 16 || token === 14 || token === 79 || token === 102;
                case 12:
                    return token === 17 || token === 22;
                case 14:
                case 18:
                case 11:
                    return token === 19;
                case 15:
                    return token === 17 || token === 19;
                case 17:
                    return token === 25 || token === 16;
                case 19:
                    return token === 14 || token === 15;
            }
        }
        function isVariableDeclaratorListTerminator() {
            if (canParseSemicolon()) {
                return true;
            }
            if (isInOrOfKeyword(token)) {
                return true;
            }
            if (token === 32) {
                return true;
            }
            return false;
        }
        function isInSomeParsingContext() {
            for (var kind = 0; kind < 21; kind++) {
                if (parsingContext & (1 << kind)) {
                    if (isListElement(kind, true) || isListTerminator(kind)) {
                        return true;
                    }
                }
            }
            return false;
        }
        function parseList(kind, checkForStrictMode, parseElement) {
            var saveParsingContext = parsingContext;
            parsingContext |= 1 << kind;
            var result = [];
            result.pos = getNodePos();
            var savedStrictModeContext = inStrictModeContext();
            while (!isListTerminator(kind)) {
                if (isListElement(kind, false)) {
                    var element = parseListElement(kind, parseElement);
                    result.push(element);
                    if (checkForStrictMode && !inStrictModeContext()) {
                        if (ts.isPrologueDirective(element)) {
                            if (isUseStrictPrologueDirective(sourceFile, element)) {
                                setStrictModeContext(true);
                                checkForStrictMode = false;
                            }
                        }
                        else {
                            checkForStrictMode = false;
                        }
                    }
                    continue;
                }
                if (abortParsingListOrMoveToNextToken(kind)) {
                    break;
                }
            }
            setStrictModeContext(savedStrictModeContext);
            result.end = getNodeEnd();
            parsingContext = saveParsingContext;
            return result;
        }
        function isUseStrictPrologueDirective(sourceFile, node) {
            ts.Debug.assert(ts.isPrologueDirective(node));
            var nodeText = ts.getSourceTextOfNodeFromSourceFile(sourceFile, node.expression);
            return nodeText === '"use strict"' || nodeText === "'use strict'";
        }
        function parseListElement(parsingContext, parseElement) {
            var node = currentNode(parsingContext);
            if (node) {
                return consumeNode(node);
            }
            return parseElement();
        }
        function currentNode(parsingContext) {
            if (parseErrorBeforeNextFinishedNode) {
                return undefined;
            }
            if (!syntaxCursor) {
                return undefined;
            }
            var node = syntaxCursor.currentNode(scanner.getStartPos());
            if (ts.nodeIsMissing(node)) {
                return undefined;
            }
            if (node.intersectsChange) {
                return undefined;
            }
            if (ts.containsParseError(node)) {
                return undefined;
            }
            var nodeContextFlags = node.parserContextFlags & 63;
            if (nodeContextFlags !== contextFlags) {
                return undefined;
            }
            if (!canReuseNode(node, parsingContext)) {
                return undefined;
            }
            return node;
        }
        function consumeNode(node) {
            scanner.setTextPos(node.end);
            nextToken();
            return node;
        }
        function canReuseNode(node, parsingContext) {
            switch (parsingContext) {
                case 1:
                    return isReusableModuleElement(node);
                case 6:
                    return isReusableClassMember(node);
                case 3:
                    return isReusableSwitchClause(node);
                case 2:
                case 4:
                    return isReusableStatement(node);
                case 7:
                    return isReusableEnumMember(node);
                case 5:
                    return isReusableTypeMember(node);
                case 9:
                    return isReusableVariableDeclaration(node);
                case 15:
                    return isReusableParameter(node);
                case 19:
                case 16:
                case 18:
                case 17:
                case 12:
                case 13:
                case 8:
            }
            return false;
        }
        function isReusableModuleElement(node) {
            if (node) {
                switch (node.kind) {
                    case 209:
                    case 208:
                    case 215:
                    case 214:
                    case 201:
                    case 202:
                    case 205:
                    case 204:
                        return true;
                }
                return isReusableStatement(node);
            }
            return false;
        }
        function isReusableClassMember(node) {
            if (node) {
                switch (node.kind) {
                    case 135:
                    case 140:
                    case 134:
                    case 136:
                    case 137:
                    case 132:
                    case 178:
                        return true;
                }
            }
            return false;
        }
        function isReusableSwitchClause(node) {
            if (node) {
                switch (node.kind) {
                    case 220:
                    case 221:
                        return true;
                }
            }
            return false;
        }
        function isReusableStatement(node) {
            if (node) {
                switch (node.kind) {
                    case 200:
                    case 180:
                    case 179:
                    case 183:
                    case 182:
                    case 195:
                    case 191:
                    case 193:
                    case 190:
                    case 189:
                    case 187:
                    case 188:
                    case 186:
                    case 185:
                    case 192:
                    case 181:
                    case 196:
                    case 194:
                    case 184:
                    case 197:
                        return true;
                }
            }
            return false;
        }
        function isReusableEnumMember(node) {
            return node.kind === 226;
        }
        function isReusableTypeMember(node) {
            if (node) {
                switch (node.kind) {
                    case 139:
                    case 133:
                    case 140:
                    case 131:
                    case 138:
                        return true;
                }
            }
            return false;
        }
        function isReusableVariableDeclaration(node) {
            if (node.kind !== 198) {
                return false;
            }
            var variableDeclarator = node;
            return variableDeclarator.initializer === undefined;
        }
        function isReusableParameter(node) {
            if (node.kind !== 129) {
                return false;
            }
            var parameter = node;
            return parameter.initializer === undefined;
        }
        function abortParsingListOrMoveToNextToken(kind) {
            parseErrorAtCurrentToken(parsingContextErrors(kind));
            if (isInSomeParsingContext()) {
                return true;
            }
            nextToken();
            return false;
        }
        function parsingContextErrors(context) {
            switch (context) {
                case 0: return ts.Diagnostics.Declaration_or_statement_expected;
                case 1: return ts.Diagnostics.Declaration_or_statement_expected;
                case 2: return ts.Diagnostics.Statement_expected;
                case 3: return ts.Diagnostics.case_or_default_expected;
                case 4: return ts.Diagnostics.Statement_expected;
                case 5: return ts.Diagnostics.Property_or_signature_expected;
                case 6: return ts.Diagnostics.Unexpected_token_A_constructor_method_accessor_or_property_was_expected;
                case 7: return ts.Diagnostics.Enum_member_expected;
                case 8: return ts.Diagnostics.Expression_expected;
                case 9: return ts.Diagnostics.Variable_declaration_expected;
                case 10: return ts.Diagnostics.Property_destructuring_pattern_expected;
                case 11: return ts.Diagnostics.Array_element_destructuring_pattern_expected;
                case 12: return ts.Diagnostics.Argument_expression_expected;
                case 13: return ts.Diagnostics.Property_assignment_expected;
                case 14: return ts.Diagnostics.Expression_or_comma_expected;
                case 15: return ts.Diagnostics.Parameter_declaration_expected;
                case 16: return ts.Diagnostics.Type_parameter_declaration_expected;
                case 17: return ts.Diagnostics.Type_argument_expected;
                case 18: return ts.Diagnostics.Type_expected;
                case 19: return ts.Diagnostics.Unexpected_token_expected;
                case 20: return ts.Diagnostics.Identifier_expected;
            }
        }
        ;
        function parseDelimitedList(kind, parseElement, considerSemicolonAsDelimeter) {
            var saveParsingContext = parsingContext;
            parsingContext |= 1 << kind;
            var result = [];
            result.pos = getNodePos();
            var commaStart = -1;
            while (true) {
                if (isListElement(kind, false)) {
                    result.push(parseListElement(kind, parseElement));
                    commaStart = scanner.getTokenPos();
                    if (parseOptional(23)) {
                        continue;
                    }
                    commaStart = -1;
                    if (isListTerminator(kind)) {
                        break;
                    }
                    parseExpected(23);
                    if (considerSemicolonAsDelimeter && token === 22 && !scanner.hasPrecedingLineBreak()) {
                        nextToken();
                    }
                    continue;
                }
                if (isListTerminator(kind)) {
                    break;
                }
                if (abortParsingListOrMoveToNextToken(kind)) {
                    break;
                }
            }
            if (commaStart >= 0) {
                result.hasTrailingComma = true;
            }
            result.end = getNodeEnd();
            parsingContext = saveParsingContext;
            return result;
        }
        function createMissingList() {
            var pos = getNodePos();
            var result = [];
            result.pos = pos;
            result.end = pos;
            return result;
        }
        function parseBracketedList(kind, parseElement, open, close) {
            if (parseExpected(open)) {
                var result = parseDelimitedList(kind, parseElement);
                parseExpected(close);
                return result;
            }
            return createMissingList();
        }
        function parseEntityName(allowReservedWords, diagnosticMessage) {
            var entity = parseIdentifier(diagnosticMessage);
            while (parseOptional(20)) {
                var node = createNode(126, entity.pos);
                node.left = entity;
                node.right = parseRightSideOfDot(allowReservedWords);
                entity = finishNode(node);
            }
            return entity;
        }
        function parseRightSideOfDot(allowIdentifierNames) {
            if (scanner.hasPrecedingLineBreak() && scanner.isReservedWord()) {
                var matchesPattern = lookAhead(nextTokenIsIdentifierOrKeywordOnSameLine);
                if (matchesPattern) {
                    return createMissingNode(65, true, ts.Diagnostics.Identifier_expected);
                }
            }
            return allowIdentifierNames ? parseIdentifierName() : parseIdentifier();
        }
        function parseTemplateExpression() {
            var template = createNode(171);
            template.head = parseLiteralNode();
            ts.Debug.assert(template.head.kind === 11, "Template head has wrong token kind");
            var templateSpans = [];
            templateSpans.pos = getNodePos();
            do {
                templateSpans.push(parseTemplateSpan());
            } while (templateSpans[templateSpans.length - 1].literal.kind === 12);
            templateSpans.end = getNodeEnd();
            template.templateSpans = templateSpans;
            return finishNode(template);
        }
        function parseTemplateSpan() {
            var span = createNode(176);
            span.expression = allowInAnd(parseExpression);
            var literal;
            if (token === 15) {
                reScanTemplateToken();
                literal = parseLiteralNode();
            }
            else {
                literal = parseExpectedToken(13, false, ts.Diagnostics._0_expected, ts.tokenToString(15));
            }
            span.literal = literal;
            return finishNode(span);
        }
        function parseLiteralNode(internName) {
            var node = createNode(token);
            var text = scanner.getTokenValue();
            node.text = internName ? internIdentifier(text) : text;
            if (scanner.hasExtendedUnicodeEscape()) {
                node.hasExtendedUnicodeEscape = true;
            }
            if (scanner.isUnterminated()) {
                node.isUnterminated = true;
            }
            var tokenPos = scanner.getTokenPos();
            nextToken();
            finishNode(node);
            if (node.kind === 7
                && sourceText.charCodeAt(tokenPos) === 48
                && ts.isOctalDigit(sourceText.charCodeAt(tokenPos + 1))) {
                node.flags |= 16384;
            }
            return node;
        }
        function parseTypeReference() {
            var node = createNode(141);
            node.typeName = parseEntityName(false, ts.Diagnostics.Type_expected);
            if (!scanner.hasPrecedingLineBreak() && token === 24) {
                node.typeArguments = parseBracketedList(17, parseType, 24, 25);
            }
            return finishNode(node);
        }
        function parseTypeQuery() {
            var node = createNode(144);
            parseExpected(97);
            node.exprName = parseEntityName(true);
            return finishNode(node);
        }
        function parseTypeParameter() {
            var node = createNode(128);
            node.name = parseIdentifier();
            if (parseOptional(79)) {
                if (isStartOfType() || !isStartOfExpression()) {
                    node.constraint = parseType();
                }
                else {
                    node.expression = parseUnaryExpressionOrHigher();
                }
            }
            return finishNode(node);
        }
        function parseTypeParameters() {
            if (token === 24) {
                return parseBracketedList(16, parseTypeParameter, 24, 25);
            }
        }
        function parseParameterType() {
            if (parseOptional(51)) {
                return token === 8
                    ? parseLiteralNode(true)
                    : parseType();
            }
            return undefined;
        }
        function isStartOfParameter() {
            return token === 21 || isIdentifierOrPattern() || ts.isModifier(token) || token === 52;
        }
        function setModifiers(node, modifiers) {
            if (modifiers) {
                node.flags |= modifiers.flags;
                node.modifiers = modifiers;
            }
        }
        function parseParameter() {
            var node = createNode(129);
            node.decorators = parseDecorators();
            setModifiers(node, parseModifiers());
            node.dotDotDotToken = parseOptionalToken(21);
            node.name = inGeneratorParameterContext() ? doInYieldContext(parseIdentifierOrPattern) : parseIdentifierOrPattern();
            if (ts.getFullWidth(node.name) === 0 && node.flags === 0 && ts.isModifier(token)) {
                nextToken();
            }
            node.questionToken = parseOptionalToken(50);
            node.type = parseParameterType();
            node.initializer = inGeneratorParameterContext() ? doOutsideOfYieldContext(parseParameterInitializer) : parseParameterInitializer();
            return finishNode(node);
        }
        function parseParameterInitializer() {
            return parseInitializer(true);
        }
        function fillSignature(returnToken, yieldAndGeneratorParameterContext, requireCompleteParameterList, signature) {
            var returnTokenRequired = returnToken === 32;
            signature.typeParameters = parseTypeParameters();
            signature.parameters = parseParameterList(yieldAndGeneratorParameterContext, requireCompleteParameterList);
            if (returnTokenRequired) {
                parseExpected(returnToken);
                signature.type = parseType();
            }
            else if (parseOptional(returnToken)) {
                signature.type = parseType();
            }
        }
        function parseParameterList(yieldAndGeneratorParameterContext, requireCompleteParameterList) {
            if (parseExpected(16)) {
                var savedYieldContext = inYieldContext();
                var savedGeneratorParameterContext = inGeneratorParameterContext();
                setYieldContext(yieldAndGeneratorParameterContext);
                setGeneratorParameterContext(yieldAndGeneratorParameterContext);
                var result = parseDelimitedList(15, parseParameter);
                setYieldContext(savedYieldContext);
                setGeneratorParameterContext(savedGeneratorParameterContext);
                if (!parseExpected(17) && requireCompleteParameterList) {
                    return undefined;
                }
                return result;
            }
            return requireCompleteParameterList ? undefined : createMissingList();
        }
        function parseTypeMemberSemicolon() {
            if (parseOptional(23)) {
                return;
            }
            parseSemicolon();
        }
        function parseSignatureMember(kind) {
            var node = createNode(kind);
            if (kind === 139) {
                parseExpected(88);
            }
            fillSignature(51, false, false, node);
            parseTypeMemberSemicolon();
            return finishNode(node);
        }
        function isIndexSignature() {
            if (token !== 18) {
                return false;
            }
            return lookAhead(isUnambiguouslyIndexSignature);
        }
        function isUnambiguouslyIndexSignature() {
            nextToken();
            if (token === 21 || token === 19) {
                return true;
            }
            if (ts.isModifier(token)) {
                nextToken();
                if (isIdentifier()) {
                    return true;
                }
            }
            else if (!isIdentifier()) {
                return false;
            }
            else {
                nextToken();
            }
            if (token === 51 || token === 23) {
                return true;
            }
            if (token !== 50) {
                return false;
            }
            nextToken();
            return token === 51 || token === 23 || token === 19;
        }
        function parseIndexSignatureDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(140, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            node.parameters = parseBracketedList(15, parseParameter, 18, 19);
            node.type = parseTypeAnnotation();
            parseTypeMemberSemicolon();
            return finishNode(node);
        }
        function parsePropertyOrMethodSignature() {
            var fullStart = scanner.getStartPos();
            var name = parsePropertyName();
            var questionToken = parseOptionalToken(50);
            if (token === 16 || token === 24) {
                var method = createNode(133, fullStart);
                method.name = name;
                method.questionToken = questionToken;
                fillSignature(51, false, false, method);
                parseTypeMemberSemicolon();
                return finishNode(method);
            }
            else {
                var property = createNode(131, fullStart);
                property.name = name;
                property.questionToken = questionToken;
                property.type = parseTypeAnnotation();
                parseTypeMemberSemicolon();
                return finishNode(property);
            }
        }
        function isStartOfTypeMember() {
            switch (token) {
                case 16:
                case 24:
                case 18:
                    return true;
                default:
                    if (ts.isModifier(token)) {
                        var result = lookAhead(isStartOfIndexSignatureDeclaration);
                        if (result) {
                            return result;
                        }
                    }
                    return isLiteralPropertyName() && lookAhead(isTypeMemberWithLiteralPropertyName);
            }
        }
        function isStartOfIndexSignatureDeclaration() {
            while (ts.isModifier(token)) {
                nextToken();
            }
            return isIndexSignature();
        }
        function isTypeMemberWithLiteralPropertyName() {
            nextToken();
            return token === 16 ||
                token === 24 ||
                token === 50 ||
                token === 51 ||
                canParseSemicolon();
        }
        function parseTypeMember() {
            switch (token) {
                case 16:
                case 24:
                    return parseSignatureMember(138);
                case 18:
                    return isIndexSignature()
                        ? parseIndexSignatureDeclaration(scanner.getStartPos(), undefined, undefined)
                        : parsePropertyOrMethodSignature();
                case 88:
                    if (lookAhead(isStartOfConstructSignature)) {
                        return parseSignatureMember(139);
                    }
                case 8:
                case 7:
                    return parsePropertyOrMethodSignature();
                default:
                    if (ts.isModifier(token)) {
                        var result = tryParse(parseIndexSignatureWithModifiers);
                        if (result) {
                            return result;
                        }
                    }
                    if (isIdentifierOrKeyword()) {
                        return parsePropertyOrMethodSignature();
                    }
            }
        }
        function parseIndexSignatureWithModifiers() {
            var fullStart = scanner.getStartPos();
            var decorators = parseDecorators();
            var modifiers = parseModifiers();
            return isIndexSignature()
                ? parseIndexSignatureDeclaration(fullStart, decorators, modifiers)
                : undefined;
        }
        function isStartOfConstructSignature() {
            nextToken();
            return token === 16 || token === 24;
        }
        function parseTypeLiteral() {
            var node = createNode(145);
            node.members = parseObjectTypeMembers();
            return finishNode(node);
        }
        function parseObjectTypeMembers() {
            var members;
            if (parseExpected(14)) {
                members = parseList(5, false, parseTypeMember);
                parseExpected(15);
            }
            else {
                members = createMissingList();
            }
            return members;
        }
        function parseTupleType() {
            var node = createNode(147);
            node.elementTypes = parseBracketedList(18, parseType, 18, 19);
            return finishNode(node);
        }
        function parseParenthesizedType() {
            var node = createNode(149);
            parseExpected(16);
            node.type = parseType();
            parseExpected(17);
            return finishNode(node);
        }
        function parseFunctionOrConstructorType(kind) {
            var node = createNode(kind);
            if (kind === 143) {
                parseExpected(88);
            }
            fillSignature(32, false, false, node);
            return finishNode(node);
        }
        function parseKeywordAndNoDot() {
            var node = parseTokenNode();
            return token === 20 ? undefined : node;
        }
        function parseNonArrayType() {
            switch (token) {
                case 112:
                case 121:
                case 119:
                case 113:
                case 122:
                    var node = tryParse(parseKeywordAndNoDot);
                    return node || parseTypeReference();
                case 99:
                    return parseTokenNode();
                case 97:
                    return parseTypeQuery();
                case 14:
                    return parseTypeLiteral();
                case 18:
                    return parseTupleType();
                case 16:
                    return parseParenthesizedType();
                default:
                    return parseTypeReference();
            }
        }
        function isStartOfType() {
            switch (token) {
                case 112:
                case 121:
                case 119:
                case 113:
                case 122:
                case 99:
                case 97:
                case 14:
                case 18:
                case 24:
                case 88:
                    return true;
                case 16:
                    return lookAhead(isStartOfParenthesizedOrFunctionType);
                default:
                    return isIdentifier();
            }
        }
        function isStartOfParenthesizedOrFunctionType() {
            nextToken();
            return token === 17 || isStartOfParameter() || isStartOfType();
        }
        function parseArrayTypeOrHigher() {
            var type = parseNonArrayType();
            while (!scanner.hasPrecedingLineBreak() && parseOptional(18)) {
                parseExpected(19);
                var node = createNode(146, type.pos);
                node.elementType = type;
                type = finishNode(node);
            }
            return type;
        }
        function parseUnionTypeOrHigher() {
            var type = parseArrayTypeOrHigher();
            if (token === 44) {
                var types = [type];
                types.pos = type.pos;
                while (parseOptional(44)) {
                    types.push(parseArrayTypeOrHigher());
                }
                types.end = getNodeEnd();
                var node = createNode(148, type.pos);
                node.types = types;
                type = finishNode(node);
            }
            return type;
        }
        function isStartOfFunctionType() {
            if (token === 24) {
                return true;
            }
            return token === 16 && lookAhead(isUnambiguouslyStartOfFunctionType);
        }
        function isUnambiguouslyStartOfFunctionType() {
            nextToken();
            if (token === 17 || token === 21) {
                return true;
            }
            if (isIdentifier() || ts.isModifier(token)) {
                nextToken();
                if (token === 51 || token === 23 ||
                    token === 50 || token === 53 ||
                    isIdentifier() || ts.isModifier(token)) {
                    return true;
                }
                if (token === 17) {
                    nextToken();
                    if (token === 32) {
                        return true;
                    }
                }
            }
            return false;
        }
        function parseType() {
            var savedYieldContext = inYieldContext();
            var savedGeneratorParameterContext = inGeneratorParameterContext();
            setYieldContext(false);
            setGeneratorParameterContext(false);
            var result = parseTypeWorker();
            setYieldContext(savedYieldContext);
            setGeneratorParameterContext(savedGeneratorParameterContext);
            return result;
        }
        function parseTypeWorker() {
            if (isStartOfFunctionType()) {
                return parseFunctionOrConstructorType(142);
            }
            if (token === 88) {
                return parseFunctionOrConstructorType(143);
            }
            return parseUnionTypeOrHigher();
        }
        function parseTypeAnnotation() {
            return parseOptional(51) ? parseType() : undefined;
        }
        function isStartOfLeftHandSideExpression() {
            switch (token) {
                case 93:
                case 91:
                case 89:
                case 95:
                case 80:
                case 7:
                case 8:
                case 10:
                case 11:
                case 16:
                case 18:
                case 14:
                case 83:
                case 69:
                case 88:
                case 36:
                case 57:
                case 65:
                    return true;
                default:
                    return isIdentifier();
            }
        }
        function isStartOfExpression() {
            if (isStartOfLeftHandSideExpression()) {
                return true;
            }
            switch (token) {
                case 33:
                case 34:
                case 47:
                case 46:
                case 74:
                case 97:
                case 99:
                case 38:
                case 39:
                case 24:
                case 110:
                    return true;
                default:
                    if (isBinaryOperator()) {
                        return true;
                    }
                    return isIdentifier();
            }
        }
        function isStartOfExpressionStatement() {
            return token !== 14 &&
                token !== 83 &&
                token !== 69 &&
                token !== 52 &&
                isStartOfExpression();
        }
        function parseExpression() {
            // Expression[in]:
            //      AssignmentExpression[in]
            //      Expression[in] , AssignmentExpression[in]
            var saveDecoratorContext = inDecoratorContext();
            if (saveDecoratorContext) {
                setDecoratorContext(false);
            }
            var expr = parseAssignmentExpressionOrHigher();
            var operatorToken;
            while ((operatorToken = parseOptionalToken(23))) {
                expr = makeBinaryExpression(expr, operatorToken, parseAssignmentExpressionOrHigher());
            }
            if (saveDecoratorContext) {
                setDecoratorContext(true);
            }
            return expr;
        }
        function parseInitializer(inParameter) {
            if (token !== 53) {
                if (scanner.hasPrecedingLineBreak() || (inParameter && token === 14) || !isStartOfExpression()) {
                    return undefined;
                }
            }
            parseExpected(53);
            return parseAssignmentExpressionOrHigher();
        }
        function parseAssignmentExpressionOrHigher() {
            //  AssignmentExpression[in,yield]:
            //      1) ConditionalExpression[?in,?yield]
            //      2) LeftHandSideExpression = AssignmentExpression[?in,?yield]
            //      3) LeftHandSideExpression AssignmentOperator AssignmentExpression[?in,?yield]
            //      4) ArrowFunctionExpression[?in,?yield]
            //      5) [+Yield] YieldExpression[?In]
            //
            // Note: for ease of implementation we treat productions '2' and '3' as the same thing.
            // (i.e. they're both BinaryExpressions with an assignment operator in it).
            if (isYieldExpression()) {
                return parseYieldExpression();
            }
            var arrowExpression = tryParseParenthesizedArrowFunctionExpression();
            if (arrowExpression) {
                return arrowExpression;
            }
            var expr = parseBinaryExpressionOrHigher(0);
            if (expr.kind === 65 && token === 32) {
                return parseSimpleArrowFunctionExpression(expr);
            }
            if (ts.isLeftHandSideExpression(expr) && ts.isAssignmentOperator(reScanGreaterToken())) {
                return makeBinaryExpression(expr, parseTokenNode(), parseAssignmentExpressionOrHigher());
            }
            return parseConditionalExpressionRest(expr);
        }
        function isYieldExpression() {
            if (token === 110) {
                if (inYieldContext()) {
                    return true;
                }
                if (inStrictModeContext()) {
                    return true;
                }
                return lookAhead(nextTokenIsIdentifierOnSameLine);
            }
            return false;
        }
        function nextTokenIsIdentifierOnSameLine() {
            nextToken();
            return !scanner.hasPrecedingLineBreak() && isIdentifier();
        }
        function nextTokenIsIdentifierOrStartOfDestructuringOnTheSameLine() {
            nextToken();
            return !scanner.hasPrecedingLineBreak() &&
                (isIdentifier() || token === 14 || token === 18);
        }
        function parseYieldExpression() {
            var node = createNode(172);
            nextToken();
            if (!scanner.hasPrecedingLineBreak() &&
                (token === 35 || isStartOfExpression())) {
                node.asteriskToken = parseOptionalToken(35);
                node.expression = parseAssignmentExpressionOrHigher();
                return finishNode(node);
            }
            else {
                return finishNode(node);
            }
        }
        function parseSimpleArrowFunctionExpression(identifier) {
            ts.Debug.assert(token === 32, "parseSimpleArrowFunctionExpression should only have been called if we had a =>");
            var node = createNode(163, identifier.pos);
            var parameter = createNode(129, identifier.pos);
            parameter.name = identifier;
            finishNode(parameter);
            node.parameters = [parameter];
            node.parameters.pos = parameter.pos;
            node.parameters.end = parameter.end;
            node.equalsGreaterThanToken = parseExpectedToken(32, false, ts.Diagnostics._0_expected, "=>");
            node.body = parseArrowFunctionExpressionBody();
            return finishNode(node);
        }
        function tryParseParenthesizedArrowFunctionExpression() {
            var triState = isParenthesizedArrowFunctionExpression();
            if (triState === 0) {
                return undefined;
            }
            var arrowFunction = triState === 1
                ? parseParenthesizedArrowFunctionExpressionHead(true)
                : tryParse(parsePossibleParenthesizedArrowFunctionExpressionHead);
            if (!arrowFunction) {
                return undefined;
            }
            var lastToken = token;
            arrowFunction.equalsGreaterThanToken = parseExpectedToken(32, false, ts.Diagnostics._0_expected, "=>");
            arrowFunction.body = (lastToken === 32 || lastToken === 14)
                ? parseArrowFunctionExpressionBody()
                : parseIdentifier();
            return finishNode(arrowFunction);
        }
        function isParenthesizedArrowFunctionExpression() {
            if (token === 16 || token === 24) {
                return lookAhead(isParenthesizedArrowFunctionExpressionWorker);
            }
            if (token === 32) {
                return 1;
            }
            return 0;
        }
        function isParenthesizedArrowFunctionExpressionWorker() {
            var first = token;
            var second = nextToken();
            if (first === 16) {
                if (second === 17) {
                    var third = nextToken();
                    switch (third) {
                        case 32:
                        case 51:
                        case 14:
                            return 1;
                        default:
                            return 0;
                    }
                }
                if (second === 18 || second === 14) {
                    return 2;
                }
                if (second === 21) {
                    return 1;
                }
                if (!isIdentifier()) {
                    return 0;
                }
                if (nextToken() === 51) {
                    return 1;
                }
                return 2;
            }
            else {
                ts.Debug.assert(first === 24);
                if (!isIdentifier()) {
                    return 0;
                }
                return 2;
            }
        }
        function parsePossibleParenthesizedArrowFunctionExpressionHead() {
            return parseParenthesizedArrowFunctionExpressionHead(false);
        }
        function parseParenthesizedArrowFunctionExpressionHead(allowAmbiguity) {
            var node = createNode(163);
            fillSignature(51, false, !allowAmbiguity, node);
            if (!node.parameters) {
                return undefined;
            }
            if (!allowAmbiguity && token !== 32 && token !== 14) {
                return undefined;
            }
            return node;
        }
        function parseArrowFunctionExpressionBody() {
            if (token === 14) {
                return parseFunctionBlock(false, false);
            }
            if (isStartOfStatement(true) &&
                !isStartOfExpressionStatement() &&
                token !== 83 &&
                token !== 69) {
                return parseFunctionBlock(false, true);
            }
            return parseAssignmentExpressionOrHigher();
        }
        function parseConditionalExpressionRest(leftOperand) {
            var questionToken = parseOptionalToken(50);
            if (!questionToken) {
                return leftOperand;
            }
            var node = createNode(170, leftOperand.pos);
            node.condition = leftOperand;
            node.questionToken = questionToken;
            node.whenTrue = doOutsideOfContext(disallowInAndDecoratorContext, parseAssignmentExpressionOrHigher);
            node.colonToken = parseExpectedToken(51, false, ts.Diagnostics._0_expected, ts.tokenToString(51));
            node.whenFalse = parseAssignmentExpressionOrHigher();
            return finishNode(node);
        }
        function parseBinaryExpressionOrHigher(precedence) {
            var leftOperand = parseUnaryExpressionOrHigher();
            return parseBinaryExpressionRest(precedence, leftOperand);
        }
        function isInOrOfKeyword(t) {
            return t === 86 || t === 125;
        }
        function parseBinaryExpressionRest(precedence, leftOperand) {
            while (true) {
                reScanGreaterToken();
                var newPrecedence = getBinaryOperatorPrecedence();
                if (newPrecedence <= precedence) {
                    break;
                }
                if (token === 86 && inDisallowInContext()) {
                    break;
                }
                leftOperand = makeBinaryExpression(leftOperand, parseTokenNode(), parseBinaryExpressionOrHigher(newPrecedence));
            }
            return leftOperand;
        }
        function isBinaryOperator() {
            if (inDisallowInContext() && token === 86) {
                return false;
            }
            return getBinaryOperatorPrecedence() > 0;
        }
        function getBinaryOperatorPrecedence() {
            switch (token) {
                case 49:
                    return 1;
                case 48:
                    return 2;
                case 44:
                    return 3;
                case 45:
                    return 4;
                case 43:
                    return 5;
                case 28:
                case 29:
                case 30:
                case 31:
                    return 6;
                case 24:
                case 25:
                case 26:
                case 27:
                case 87:
                case 86:
                    return 7;
                case 40:
                case 41:
                case 42:
                    return 8;
                case 33:
                case 34:
                    return 9;
                case 35:
                case 36:
                case 37:
                    return 10;
            }
            return -1;
        }
        function makeBinaryExpression(left, operatorToken, right) {
            var node = createNode(169, left.pos);
            node.left = left;
            node.operatorToken = operatorToken;
            node.right = right;
            return finishNode(node);
        }
        function parsePrefixUnaryExpression() {
            var node = createNode(167);
            node.operator = token;
            nextToken();
            node.operand = parseUnaryExpressionOrHigher();
            return finishNode(node);
        }
        function parseDeleteExpression() {
            var node = createNode(164);
            nextToken();
            node.expression = parseUnaryExpressionOrHigher();
            return finishNode(node);
        }
        function parseTypeOfExpression() {
            var node = createNode(165);
            nextToken();
            node.expression = parseUnaryExpressionOrHigher();
            return finishNode(node);
        }
        function parseVoidExpression() {
            var node = createNode(166);
            nextToken();
            node.expression = parseUnaryExpressionOrHigher();
            return finishNode(node);
        }
        function parseUnaryExpressionOrHigher() {
            switch (token) {
                case 33:
                case 34:
                case 47:
                case 46:
                case 38:
                case 39:
                    return parsePrefixUnaryExpression();
                case 74:
                    return parseDeleteExpression();
                case 97:
                    return parseTypeOfExpression();
                case 99:
                    return parseVoidExpression();
                case 24:
                    return parseTypeAssertion();
                default:
                    return parsePostfixExpressionOrHigher();
            }
        }
        function parsePostfixExpressionOrHigher() {
            var expression = parseLeftHandSideExpressionOrHigher();
            ts.Debug.assert(ts.isLeftHandSideExpression(expression));
            if ((token === 38 || token === 39) && !scanner.hasPrecedingLineBreak()) {
                var node = createNode(168, expression.pos);
                node.operand = expression;
                node.operator = token;
                nextToken();
                return finishNode(node);
            }
            return expression;
        }
        function parseLeftHandSideExpressionOrHigher() {
            var expression = token === 91
                ? parseSuperExpression()
                : parseMemberExpressionOrHigher();
            return parseCallExpressionRest(expression);
        }
        function parseMemberExpressionOrHigher() {
            var expression = parsePrimaryExpression();
            return parseMemberExpressionRest(expression);
        }
        function parseSuperExpression() {
            var expression = parseTokenNode();
            if (token === 16 || token === 20) {
                return expression;
            }
            var node = createNode(155, expression.pos);
            node.expression = expression;
            node.dotToken = parseExpectedToken(20, false, ts.Diagnostics.super_must_be_followed_by_an_argument_list_or_member_access);
            node.name = parseRightSideOfDot(true);
            return finishNode(node);
        }
        function parseTypeAssertion() {
            var node = createNode(160);
            parseExpected(24);
            node.type = parseType();
            parseExpected(25);
            node.expression = parseUnaryExpressionOrHigher();
            return finishNode(node);
        }
        function parseMemberExpressionRest(expression) {
            while (true) {
                var dotToken = parseOptionalToken(20);
                if (dotToken) {
                    var propertyAccess = createNode(155, expression.pos);
                    propertyAccess.expression = expression;
                    propertyAccess.dotToken = dotToken;
                    propertyAccess.name = parseRightSideOfDot(true);
                    expression = finishNode(propertyAccess);
                    continue;
                }
                if (!inDecoratorContext() && parseOptional(18)) {
                    var indexedAccess = createNode(156, expression.pos);
                    indexedAccess.expression = expression;
                    if (token !== 19) {
                        indexedAccess.argumentExpression = allowInAnd(parseExpression);
                        if (indexedAccess.argumentExpression.kind === 8 || indexedAccess.argumentExpression.kind === 7) {
                            var literal = indexedAccess.argumentExpression;
                            literal.text = internIdentifier(literal.text);
                        }
                    }
                    parseExpected(19);
                    expression = finishNode(indexedAccess);
                    continue;
                }
                if (token === 10 || token === 11) {
                    var tagExpression = createNode(159, expression.pos);
                    tagExpression.tag = expression;
                    tagExpression.template = token === 10
                        ? parseLiteralNode()
                        : parseTemplateExpression();
                    expression = finishNode(tagExpression);
                    continue;
                }
                return expression;
            }
        }
        function parseCallExpressionRest(expression) {
            while (true) {
                expression = parseMemberExpressionRest(expression);
                if (token === 24) {
                    var typeArguments = tryParse(parseTypeArgumentsInExpression);
                    if (!typeArguments) {
                        return expression;
                    }
                    var callExpr = createNode(157, expression.pos);
                    callExpr.expression = expression;
                    callExpr.typeArguments = typeArguments;
                    callExpr.arguments = parseArgumentList();
                    expression = finishNode(callExpr);
                    continue;
                }
                else if (token === 16) {
                    var callExpr = createNode(157, expression.pos);
                    callExpr.expression = expression;
                    callExpr.arguments = parseArgumentList();
                    expression = finishNode(callExpr);
                    continue;
                }
                return expression;
            }
        }
        function parseArgumentList() {
            parseExpected(16);
            var result = parseDelimitedList(12, parseArgumentExpression);
            parseExpected(17);
            return result;
        }
        function parseTypeArgumentsInExpression() {
            if (!parseOptional(24)) {
                return undefined;
            }
            var typeArguments = parseDelimitedList(17, parseType);
            if (!parseExpected(25)) {
                return undefined;
            }
            return typeArguments && canFollowTypeArgumentsInExpression()
                ? typeArguments
                : undefined;
        }
        function canFollowTypeArgumentsInExpression() {
            switch (token) {
                case 16:
                case 20:
                case 17:
                case 19:
                case 51:
                case 22:
                case 50:
                case 28:
                case 30:
                case 29:
                case 31:
                case 48:
                case 49:
                case 45:
                case 43:
                case 44:
                case 15:
                case 1:
                    return true;
                case 23:
                case 14:
                default:
                    return false;
            }
        }
        function parsePrimaryExpression() {
            switch (token) {
                case 7:
                case 8:
                case 10:
                    return parseLiteralNode();
                case 93:
                case 91:
                case 89:
                case 95:
                case 80:
                    return parseTokenNode();
                case 16:
                    return parseParenthesizedExpression();
                case 18:
                    return parseArrayLiteralExpression();
                case 14:
                    return parseObjectLiteralExpression();
                case 69:
                    return parseClassExpression();
                case 83:
                    return parseFunctionExpression();
                case 88:
                    return parseNewExpression();
                case 36:
                case 57:
                    if (reScanSlashToken() === 9) {
                        return parseLiteralNode();
                    }
                    break;
                case 11:
                    return parseTemplateExpression();
            }
            return parseIdentifier(ts.Diagnostics.Expression_expected);
        }
        function parseParenthesizedExpression() {
            var node = createNode(161);
            parseExpected(16);
            node.expression = allowInAnd(parseExpression);
            parseExpected(17);
            return finishNode(node);
        }
        function parseSpreadElement() {
            var node = createNode(173);
            parseExpected(21);
            node.expression = parseAssignmentExpressionOrHigher();
            return finishNode(node);
        }
        function parseArgumentOrArrayLiteralElement() {
            return token === 21 ? parseSpreadElement() :
                token === 23 ? createNode(175) :
                    parseAssignmentExpressionOrHigher();
        }
        function parseArgumentExpression() {
            return doOutsideOfContext(disallowInAndDecoratorContext, parseArgumentOrArrayLiteralElement);
        }
        function parseArrayLiteralExpression() {
            var node = createNode(153);
            parseExpected(18);
            if (scanner.hasPrecedingLineBreak())
                node.flags |= 512;
            node.elements = parseDelimitedList(14, parseArgumentOrArrayLiteralElement);
            parseExpected(19);
            return finishNode(node);
        }
        function tryParseAccessorDeclaration(fullStart, decorators, modifiers) {
            if (parseContextualModifier(116)) {
                return parseAccessorDeclaration(136, fullStart, decorators, modifiers);
            }
            else if (parseContextualModifier(120)) {
                return parseAccessorDeclaration(137, fullStart, decorators, modifiers);
            }
            return undefined;
        }
        function parseObjectLiteralElement() {
            var fullStart = scanner.getStartPos();
            var decorators = parseDecorators();
            var modifiers = parseModifiers();
            var accessor = tryParseAccessorDeclaration(fullStart, decorators, modifiers);
            if (accessor) {
                return accessor;
            }
            var asteriskToken = parseOptionalToken(35);
            var tokenIsIdentifier = isIdentifier();
            var nameToken = token;
            var propertyName = parsePropertyName();
            var questionToken = parseOptionalToken(50);
            if (asteriskToken || token === 16 || token === 24) {
                return parseMethodDeclaration(fullStart, decorators, modifiers, asteriskToken, propertyName, questionToken);
            }
            if ((token === 23 || token === 15) && tokenIsIdentifier) {
                var shorthandDeclaration = createNode(225, fullStart);
                shorthandDeclaration.name = propertyName;
                shorthandDeclaration.questionToken = questionToken;
                return finishNode(shorthandDeclaration);
            }
            else {
                var propertyAssignment = createNode(224, fullStart);
                propertyAssignment.name = propertyName;
                propertyAssignment.questionToken = questionToken;
                parseExpected(51);
                propertyAssignment.initializer = allowInAnd(parseAssignmentExpressionOrHigher);
                return finishNode(propertyAssignment);
            }
        }
        function parseObjectLiteralExpression() {
            var node = createNode(154);
            parseExpected(14);
            if (scanner.hasPrecedingLineBreak()) {
                node.flags |= 512;
            }
            node.properties = parseDelimitedList(13, parseObjectLiteralElement, true);
            parseExpected(15);
            return finishNode(node);
        }
        function parseFunctionExpression() {
            var saveDecoratorContext = inDecoratorContext();
            if (saveDecoratorContext) {
                setDecoratorContext(false);
            }
            var node = createNode(162);
            parseExpected(83);
            node.asteriskToken = parseOptionalToken(35);
            node.name = node.asteriskToken ? doInYieldContext(parseOptionalIdentifier) : parseOptionalIdentifier();
            fillSignature(51, !!node.asteriskToken, false, node);
            node.body = parseFunctionBlock(!!node.asteriskToken, false);
            if (saveDecoratorContext) {
                setDecoratorContext(true);
            }
            return finishNode(node);
        }
        function parseOptionalIdentifier() {
            return isIdentifier() ? parseIdentifier() : undefined;
        }
        function parseNewExpression() {
            var node = createNode(158);
            parseExpected(88);
            node.expression = parseMemberExpressionOrHigher();
            node.typeArguments = tryParse(parseTypeArgumentsInExpression);
            if (node.typeArguments || token === 16) {
                node.arguments = parseArgumentList();
            }
            return finishNode(node);
        }
        function parseBlock(ignoreMissingOpenBrace, checkForStrictMode, diagnosticMessage) {
            var node = createNode(179);
            if (parseExpected(14, diagnosticMessage) || ignoreMissingOpenBrace) {
                node.statements = parseList(2, checkForStrictMode, parseStatement);
                parseExpected(15);
            }
            else {
                node.statements = createMissingList();
            }
            return finishNode(node);
        }
        function parseFunctionBlock(allowYield, ignoreMissingOpenBrace, diagnosticMessage) {
            var savedYieldContext = inYieldContext();
            setYieldContext(allowYield);
            var saveDecoratorContext = inDecoratorContext();
            if (saveDecoratorContext) {
                setDecoratorContext(false);
            }
            var block = parseBlock(ignoreMissingOpenBrace, true, diagnosticMessage);
            if (saveDecoratorContext) {
                setDecoratorContext(true);
            }
            setYieldContext(savedYieldContext);
            return block;
        }
        function parseEmptyStatement() {
            var node = createNode(181);
            parseExpected(22);
            return finishNode(node);
        }
        function parseIfStatement() {
            var node = createNode(183);
            parseExpected(84);
            parseExpected(16);
            node.expression = allowInAnd(parseExpression);
            parseExpected(17);
            node.thenStatement = parseStatement();
            node.elseStatement = parseOptional(76) ? parseStatement() : undefined;
            return finishNode(node);
        }
        function parseDoStatement() {
            var node = createNode(184);
            parseExpected(75);
            node.statement = parseStatement();
            parseExpected(100);
            parseExpected(16);
            node.expression = allowInAnd(parseExpression);
            parseExpected(17);
            parseOptional(22);
            return finishNode(node);
        }
        function parseWhileStatement() {
            var node = createNode(185);
            parseExpected(100);
            parseExpected(16);
            node.expression = allowInAnd(parseExpression);
            parseExpected(17);
            node.statement = parseStatement();
            return finishNode(node);
        }
        function parseForOrForInOrForOfStatement() {
            var pos = getNodePos();
            parseExpected(82);
            parseExpected(16);
            var initializer = undefined;
            if (token !== 22) {
                if (token === 98 || token === 104 || token === 70) {
                    initializer = parseVariableDeclarationList(true);
                }
                else {
                    initializer = disallowInAnd(parseExpression);
                }
            }
            var forOrForInOrForOfStatement;
            if (parseOptional(86)) {
                var forInStatement = createNode(187, pos);
                forInStatement.initializer = initializer;
                forInStatement.expression = allowInAnd(parseExpression);
                parseExpected(17);
                forOrForInOrForOfStatement = forInStatement;
            }
            else if (parseOptional(125)) {
                var forOfStatement = createNode(188, pos);
                forOfStatement.initializer = initializer;
                forOfStatement.expression = allowInAnd(parseAssignmentExpressionOrHigher);
                parseExpected(17);
                forOrForInOrForOfStatement = forOfStatement;
            }
            else {
                var forStatement = createNode(186, pos);
                forStatement.initializer = initializer;
                parseExpected(22);
                if (token !== 22 && token !== 17) {
                    forStatement.condition = allowInAnd(parseExpression);
                }
                parseExpected(22);
                if (token !== 17) {
                    forStatement.incrementor = allowInAnd(parseExpression);
                }
                parseExpected(17);
                forOrForInOrForOfStatement = forStatement;
            }
            forOrForInOrForOfStatement.statement = parseStatement();
            return finishNode(forOrForInOrForOfStatement);
        }
        function parseBreakOrContinueStatement(kind) {
            var node = createNode(kind);
            parseExpected(kind === 190 ? 66 : 71);
            if (!canParseSemicolon()) {
                node.label = parseIdentifier();
            }
            parseSemicolon();
            return finishNode(node);
        }
        function parseReturnStatement() {
            var node = createNode(191);
            parseExpected(90);
            if (!canParseSemicolon()) {
                node.expression = allowInAnd(parseExpression);
            }
            parseSemicolon();
            return finishNode(node);
        }
        function parseWithStatement() {
            var node = createNode(192);
            parseExpected(101);
            parseExpected(16);
            node.expression = allowInAnd(parseExpression);
            parseExpected(17);
            node.statement = parseStatement();
            return finishNode(node);
        }
        function parseCaseClause() {
            var node = createNode(220);
            parseExpected(67);
            node.expression = allowInAnd(parseExpression);
            parseExpected(51);
            node.statements = parseList(4, false, parseStatement);
            return finishNode(node);
        }
        function parseDefaultClause() {
            var node = createNode(221);
            parseExpected(73);
            parseExpected(51);
            node.statements = parseList(4, false, parseStatement);
            return finishNode(node);
        }
        function parseCaseOrDefaultClause() {
            return token === 67 ? parseCaseClause() : parseDefaultClause();
        }
        function parseSwitchStatement() {
            var node = createNode(193);
            parseExpected(92);
            parseExpected(16);
            node.expression = allowInAnd(parseExpression);
            parseExpected(17);
            var caseBlock = createNode(207, scanner.getStartPos());
            parseExpected(14);
            caseBlock.clauses = parseList(3, false, parseCaseOrDefaultClause);
            parseExpected(15);
            node.caseBlock = finishNode(caseBlock);
            return finishNode(node);
        }
        function parseThrowStatement() {
            // ThrowStatement[Yield] :
            //      throw [no LineTerminator here]Expression[In, ?Yield];
            var node = createNode(195);
            parseExpected(94);
            node.expression = scanner.hasPrecedingLineBreak() ? undefined : allowInAnd(parseExpression);
            parseSemicolon();
            return finishNode(node);
        }
        function parseTryStatement() {
            var node = createNode(196);
            parseExpected(96);
            node.tryBlock = parseBlock(false, false);
            node.catchClause = token === 68 ? parseCatchClause() : undefined;
            if (!node.catchClause || token === 81) {
                parseExpected(81);
                node.finallyBlock = parseBlock(false, false);
            }
            return finishNode(node);
        }
        function parseCatchClause() {
            var result = createNode(223);
            parseExpected(68);
            if (parseExpected(16)) {
                result.variableDeclaration = parseVariableDeclaration();
            }
            parseExpected(17);
            result.block = parseBlock(false, false);
            return finishNode(result);
        }
        function parseDebuggerStatement() {
            var node = createNode(197);
            parseExpected(72);
            parseSemicolon();
            return finishNode(node);
        }
        function parseExpressionOrLabeledStatement() {
            var fullStart = scanner.getStartPos();
            var expression = allowInAnd(parseExpression);
            if (expression.kind === 65 && parseOptional(51)) {
                var labeledStatement = createNode(194, fullStart);
                labeledStatement.label = expression;
                labeledStatement.statement = parseStatement();
                return finishNode(labeledStatement);
            }
            else {
                var expressionStatement = createNode(182, fullStart);
                expressionStatement.expression = expression;
                parseSemicolon();
                return finishNode(expressionStatement);
            }
        }
        function isStartOfStatement(inErrorRecovery) {
            if (ts.isModifier(token)) {
                var result = lookAhead(parseVariableStatementOrFunctionDeclarationOrClassDeclarationWithDecoratorsOrModifiers);
                if (result) {
                    return true;
                }
            }
            switch (token) {
                case 22:
                    return !inErrorRecovery;
                case 14:
                case 98:
                case 104:
                case 83:
                case 69:
                case 84:
                case 75:
                case 100:
                case 82:
                case 71:
                case 66:
                case 90:
                case 101:
                case 92:
                case 94:
                case 96:
                case 72:
                case 68:
                case 81:
                    return true;
                case 70:
                    var isConstEnum = lookAhead(nextTokenIsEnumKeyword);
                    return !isConstEnum;
                case 103:
                case 117:
                case 77:
                case 123:
                    if (isDeclarationStart()) {
                        return false;
                    }
                case 108:
                case 106:
                case 107:
                case 109:
                    if (lookAhead(nextTokenIsIdentifierOrKeywordOnSameLine)) {
                        return false;
                    }
                default:
                    return isStartOfExpression();
            }
        }
        function nextTokenIsEnumKeyword() {
            nextToken();
            return token === 77;
        }
        function nextTokenIsIdentifierOrKeywordOnSameLine() {
            nextToken();
            return isIdentifierOrKeyword() && !scanner.hasPrecedingLineBreak();
        }
        function parseStatement() {
            switch (token) {
                case 14:
                    return parseBlock(false, false);
                case 98:
                case 70:
                    return parseVariableStatement(scanner.getStartPos(), undefined, undefined);
                case 83:
                    return parseFunctionDeclaration(scanner.getStartPos(), undefined, undefined);
                case 69:
                    return parseClassDeclaration(scanner.getStartPos(), undefined, undefined);
                case 22:
                    return parseEmptyStatement();
                case 84:
                    return parseIfStatement();
                case 75:
                    return parseDoStatement();
                case 100:
                    return parseWhileStatement();
                case 82:
                    return parseForOrForInOrForOfStatement();
                case 71:
                    return parseBreakOrContinueStatement(189);
                case 66:
                    return parseBreakOrContinueStatement(190);
                case 90:
                    return parseReturnStatement();
                case 101:
                    return parseWithStatement();
                case 92:
                    return parseSwitchStatement();
                case 94:
                    return parseThrowStatement();
                case 96:
                case 68:
                case 81:
                    return parseTryStatement();
                case 72:
                    return parseDebuggerStatement();
                case 104:
                    if (isLetDeclaration()) {
                        return parseVariableStatement(scanner.getStartPos(), undefined, undefined);
                    }
                default:
                    if (ts.isModifier(token) || token === 52) {
                        var result = tryParse(parseVariableStatementOrFunctionDeclarationOrClassDeclarationWithDecoratorsOrModifiers);
                        if (result) {
                            return result;
                        }
                    }
                    return parseExpressionOrLabeledStatement();
            }
        }
        function parseVariableStatementOrFunctionDeclarationOrClassDeclarationWithDecoratorsOrModifiers() {
            var start = scanner.getStartPos();
            var decorators = parseDecorators();
            var modifiers = parseModifiers();
            switch (token) {
                case 70:
                    var nextTokenIsEnum = lookAhead(nextTokenIsEnumKeyword);
                    if (nextTokenIsEnum) {
                        return undefined;
                    }
                    return parseVariableStatement(start, decorators, modifiers);
                case 104:
                    if (!isLetDeclaration()) {
                        return undefined;
                    }
                    return parseVariableStatement(start, decorators, modifiers);
                case 98:
                    return parseVariableStatement(start, decorators, modifiers);
                case 83:
                    return parseFunctionDeclaration(start, decorators, modifiers);
                case 69:
                    return parseClassDeclaration(start, decorators, modifiers);
            }
            return undefined;
        }
        function parseFunctionBlockOrSemicolon(isGenerator, diagnosticMessage) {
            if (token !== 14 && canParseSemicolon()) {
                parseSemicolon();
                return;
            }
            return parseFunctionBlock(isGenerator, false, diagnosticMessage);
        }
        function parseArrayBindingElement() {
            if (token === 23) {
                return createNode(175);
            }
            var node = createNode(152);
            node.dotDotDotToken = parseOptionalToken(21);
            node.name = parseIdentifierOrPattern();
            node.initializer = parseInitializer(false);
            return finishNode(node);
        }
        function parseObjectBindingElement() {
            var node = createNode(152);
            var tokenIsIdentifier = isIdentifier();
            var propertyName = parsePropertyName();
            if (tokenIsIdentifier && token !== 51) {
                node.name = propertyName;
            }
            else {
                parseExpected(51);
                node.propertyName = propertyName;
                node.name = parseIdentifierOrPattern();
            }
            node.initializer = parseInitializer(false);
            return finishNode(node);
        }
        function parseObjectBindingPattern() {
            var node = createNode(150);
            parseExpected(14);
            node.elements = parseDelimitedList(10, parseObjectBindingElement);
            parseExpected(15);
            return finishNode(node);
        }
        function parseArrayBindingPattern() {
            var node = createNode(151);
            parseExpected(18);
            node.elements = parseDelimitedList(11, parseArrayBindingElement);
            parseExpected(19);
            return finishNode(node);
        }
        function isIdentifierOrPattern() {
            return token === 14 || token === 18 || isIdentifier();
        }
        function parseIdentifierOrPattern() {
            if (token === 18) {
                return parseArrayBindingPattern();
            }
            if (token === 14) {
                return parseObjectBindingPattern();
            }
            return parseIdentifier();
        }
        function parseVariableDeclaration() {
            var node = createNode(198);
            node.name = parseIdentifierOrPattern();
            node.type = parseTypeAnnotation();
            if (!isInOrOfKeyword(token)) {
                node.initializer = parseInitializer(false);
            }
            return finishNode(node);
        }
        function parseVariableDeclarationList(inForStatementInitializer) {
            var node = createNode(199);
            switch (token) {
                case 98:
                    break;
                case 104:
                    node.flags |= 4096;
                    break;
                case 70:
                    node.flags |= 8192;
                    break;
                default:
                    ts.Debug.fail();
            }
            nextToken();
            if (token === 125 && lookAhead(canFollowContextualOfKeyword)) {
                node.declarations = createMissingList();
            }
            else {
                var savedDisallowIn = inDisallowInContext();
                setDisallowInContext(inForStatementInitializer);
                node.declarations = parseDelimitedList(9, parseVariableDeclaration);
                setDisallowInContext(savedDisallowIn);
            }
            return finishNode(node);
        }
        function canFollowContextualOfKeyword() {
            return nextTokenIsIdentifier() && nextToken() === 17;
        }
        function parseVariableStatement(fullStart, decorators, modifiers) {
            var node = createNode(180, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            node.declarationList = parseVariableDeclarationList(false);
            parseSemicolon();
            return finishNode(node);
        }
        function parseFunctionDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(200, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(83);
            node.asteriskToken = parseOptionalToken(35);
            node.name = node.flags & 256 ? parseOptionalIdentifier() : parseIdentifier();
            fillSignature(51, !!node.asteriskToken, false, node);
            node.body = parseFunctionBlockOrSemicolon(!!node.asteriskToken, ts.Diagnostics.or_expected);
            return finishNode(node);
        }
        function parseConstructorDeclaration(pos, decorators, modifiers) {
            var node = createNode(135, pos);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(114);
            fillSignature(51, false, false, node);
            node.body = parseFunctionBlockOrSemicolon(false, ts.Diagnostics.or_expected);
            return finishNode(node);
        }
        function parseMethodDeclaration(fullStart, decorators, modifiers, asteriskToken, name, questionToken, diagnosticMessage) {
            var method = createNode(134, fullStart);
            method.decorators = decorators;
            setModifiers(method, modifiers);
            method.asteriskToken = asteriskToken;
            method.name = name;
            method.questionToken = questionToken;
            fillSignature(51, !!asteriskToken, false, method);
            method.body = parseFunctionBlockOrSemicolon(!!asteriskToken, diagnosticMessage);
            return finishNode(method);
        }
        function parsePropertyDeclaration(fullStart, decorators, modifiers, name, questionToken) {
            var property = createNode(132, fullStart);
            property.decorators = decorators;
            setModifiers(property, modifiers);
            property.name = name;
            property.questionToken = questionToken;
            property.type = parseTypeAnnotation();
            property.initializer = allowInAnd(parseNonParameterInitializer);
            parseSemicolon();
            return finishNode(property);
        }
        function parsePropertyOrMethodDeclaration(fullStart, decorators, modifiers) {
            var asteriskToken = parseOptionalToken(35);
            var name = parsePropertyName();
            var questionToken = parseOptionalToken(50);
            if (asteriskToken || token === 16 || token === 24) {
                return parseMethodDeclaration(fullStart, decorators, modifiers, asteriskToken, name, questionToken, ts.Diagnostics.or_expected);
            }
            else {
                return parsePropertyDeclaration(fullStart, decorators, modifiers, name, questionToken);
            }
        }
        function parseNonParameterInitializer() {
            return parseInitializer(false);
        }
        function parseAccessorDeclaration(kind, fullStart, decorators, modifiers) {
            var node = createNode(kind, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            node.name = parsePropertyName();
            fillSignature(51, false, false, node);
            node.body = parseFunctionBlockOrSemicolon(false);
            return finishNode(node);
        }
        function isClassMemberModifier(idToken) {
            switch (idToken) {
                case 108:
                case 106:
                case 107:
                case 109:
                    return true;
                default:
                    return false;
            }
        }
        function isClassMemberStart() {
            var idToken;
            if (token === 52) {
                return true;
            }
            while (ts.isModifier(token)) {
                idToken = token;
                if (isClassMemberModifier(idToken)) {
                    return true;
                }
                nextToken();
            }
            if (token === 35) {
                return true;
            }
            if (isLiteralPropertyName()) {
                idToken = token;
                nextToken();
            }
            if (token === 18) {
                return true;
            }
            if (idToken !== undefined) {
                if (!ts.isKeyword(idToken) || idToken === 120 || idToken === 116) {
                    return true;
                }
                switch (token) {
                    case 16:
                    case 24:
                    case 51:
                    case 53:
                    case 50:
                        return true;
                    default:
                        return canParseSemicolon();
                }
            }
            return false;
        }
        function parseDecorators() {
            var decorators;
            while (true) {
                var decoratorStart = getNodePos();
                if (!parseOptional(52)) {
                    break;
                }
                if (!decorators) {
                    decorators = [];
                    decorators.pos = scanner.getStartPos();
                }
                var decorator = createNode(130, decoratorStart);
                decorator.expression = doInDecoratorContext(parseLeftHandSideExpressionOrHigher);
                decorators.push(finishNode(decorator));
            }
            if (decorators) {
                decorators.end = getNodeEnd();
            }
            return decorators;
        }
        function parseModifiers() {
            var flags = 0;
            var modifiers;
            while (true) {
                var modifierStart = scanner.getStartPos();
                var modifierKind = token;
                if (!parseAnyContextualModifier()) {
                    break;
                }
                if (!modifiers) {
                    modifiers = [];
                    modifiers.pos = modifierStart;
                }
                flags |= ts.modifierToFlag(modifierKind);
                modifiers.push(finishNode(createNode(modifierKind, modifierStart)));
            }
            if (modifiers) {
                modifiers.flags = flags;
                modifiers.end = scanner.getStartPos();
            }
            return modifiers;
        }
        function parseClassElement() {
            if (token === 22) {
                var result = createNode(178);
                nextToken();
                return finishNode(result);
            }
            var fullStart = getNodePos();
            var decorators = parseDecorators();
            var modifiers = parseModifiers();
            var accessor = tryParseAccessorDeclaration(fullStart, decorators, modifiers);
            if (accessor) {
                return accessor;
            }
            if (token === 114) {
                return parseConstructorDeclaration(fullStart, decorators, modifiers);
            }
            if (isIndexSignature()) {
                return parseIndexSignatureDeclaration(fullStart, decorators, modifiers);
            }
            if (isIdentifierOrKeyword() ||
                token === 8 ||
                token === 7 ||
                token === 35 ||
                token === 18) {
                return parsePropertyOrMethodDeclaration(fullStart, decorators, modifiers);
            }
            if (decorators) {
                var name_1 = createMissingNode(65, true, ts.Diagnostics.Declaration_expected);
                return parsePropertyDeclaration(fullStart, decorators, modifiers, name_1, undefined);
            }
            ts.Debug.fail("Should not have attempted to parse class member declaration.");
        }
        function parseClassExpression() {
            return parseClassDeclarationOrExpression(scanner.getStartPos(), undefined, undefined, 174);
        }
        function parseClassDeclaration(fullStart, decorators, modifiers) {
            return parseClassDeclarationOrExpression(fullStart, decorators, modifiers, 201);
        }
        function parseClassDeclarationOrExpression(fullStart, decorators, modifiers, kind) {
            var savedStrictModeContext = inStrictModeContext();
            setStrictModeContext(true);
            var node = createNode(kind, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(69);
            node.name = parseOptionalIdentifier();
            node.typeParameters = parseTypeParameters();
            node.heritageClauses = parseHeritageClauses(true);
            if (parseExpected(14)) {
                node.members = inGeneratorParameterContext()
                    ? doOutsideOfYieldContext(parseClassMembers)
                    : parseClassMembers();
                parseExpected(15);
            }
            else {
                node.members = createMissingList();
            }
            var finishedNode = finishNode(node);
            setStrictModeContext(savedStrictModeContext);
            return finishedNode;
        }
        function parseHeritageClauses(isClassHeritageClause) {
            // ClassTail[Yield,GeneratorParameter] : See 14.5
            //      [~GeneratorParameter]ClassHeritage[?Yield]opt { ClassBody[?Yield]opt }
            //      [+GeneratorParameter] ClassHeritageopt { ClassBodyopt }
            if (isHeritageClause()) {
                return isClassHeritageClause && inGeneratorParameterContext()
                    ? doOutsideOfYieldContext(parseHeritageClausesWorker)
                    : parseHeritageClausesWorker();
            }
            return undefined;
        }
        function parseHeritageClausesWorker() {
            return parseList(19, false, parseHeritageClause);
        }
        function parseHeritageClause() {
            if (token === 79 || token === 102) {
                var node = createNode(222);
                node.token = token;
                nextToken();
                node.types = parseDelimitedList(8, parseHeritageClauseElement);
                return finishNode(node);
            }
            return undefined;
        }
        function parseHeritageClauseElement() {
            var node = createNode(177);
            node.expression = parseLeftHandSideExpressionOrHigher();
            if (token === 24) {
                node.typeArguments = parseBracketedList(17, parseType, 24, 25);
            }
            return finishNode(node);
        }
        function isHeritageClause() {
            return token === 79 || token === 102;
        }
        function parseClassMembers() {
            return parseList(6, false, parseClassElement);
        }
        function parseInterfaceDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(202, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(103);
            node.name = parseIdentifier();
            node.typeParameters = parseTypeParameters();
            node.heritageClauses = parseHeritageClauses(false);
            node.members = parseObjectTypeMembers();
            return finishNode(node);
        }
        function parseTypeAliasDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(203, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(123);
            node.name = parseIdentifier();
            parseExpected(53);
            node.type = parseType();
            parseSemicolon();
            return finishNode(node);
        }
        function parseEnumMember() {
            var node = createNode(226, scanner.getStartPos());
            node.name = parsePropertyName();
            node.initializer = allowInAnd(parseNonParameterInitializer);
            return finishNode(node);
        }
        function parseEnumDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(204, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(77);
            node.name = parseIdentifier();
            if (parseExpected(14)) {
                node.members = parseDelimitedList(7, parseEnumMember);
                parseExpected(15);
            }
            else {
                node.members = createMissingList();
            }
            return finishNode(node);
        }
        function parseModuleBlock() {
            var node = createNode(206, scanner.getStartPos());
            if (parseExpected(14)) {
                node.statements = parseList(1, false, parseModuleElement);
                parseExpected(15);
            }
            else {
                node.statements = createMissingList();
            }
            return finishNode(node);
        }
        function parseInternalModuleTail(fullStart, decorators, modifiers, flags) {
            var node = createNode(205, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            node.flags |= flags;
            node.name = parseIdentifier();
            node.body = parseOptional(20)
                ? parseInternalModuleTail(getNodePos(), undefined, undefined, 1)
                : parseModuleBlock();
            return finishNode(node);
        }
        function parseAmbientExternalModuleDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(205, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            node.name = parseLiteralNode(true);
            node.body = parseModuleBlock();
            return finishNode(node);
        }
        function parseModuleDeclaration(fullStart, decorators, modifiers) {
            parseExpected(117);
            return token === 8
                ? parseAmbientExternalModuleDeclaration(fullStart, decorators, modifiers)
                : parseInternalModuleTail(fullStart, decorators, modifiers, modifiers ? modifiers.flags : 0);
        }
        function isExternalModuleReference() {
            return token === 118 &&
                lookAhead(nextTokenIsOpenParen);
        }
        function nextTokenIsOpenParen() {
            return nextToken() === 16;
        }
        function nextTokenIsCommaOrFromKeyword() {
            nextToken();
            return token === 23 ||
                token === 124;
        }
        function parseImportDeclarationOrImportEqualsDeclaration(fullStart, decorators, modifiers) {
            parseExpected(85);
            var afterImportPos = scanner.getStartPos();
            var identifier;
            if (isIdentifier()) {
                identifier = parseIdentifier();
                if (token !== 23 && token !== 124) {
                    var importEqualsDeclaration = createNode(208, fullStart);
                    importEqualsDeclaration.decorators = decorators;
                    setModifiers(importEqualsDeclaration, modifiers);
                    importEqualsDeclaration.name = identifier;
                    parseExpected(53);
                    importEqualsDeclaration.moduleReference = parseModuleReference();
                    parseSemicolon();
                    return finishNode(importEqualsDeclaration);
                }
            }
            var importDeclaration = createNode(209, fullStart);
            importDeclaration.decorators = decorators;
            setModifiers(importDeclaration, modifiers);
            if (identifier ||
                token === 35 ||
                token === 14) {
                importDeclaration.importClause = parseImportClause(identifier, afterImportPos);
                parseExpected(124);
            }
            importDeclaration.moduleSpecifier = parseModuleSpecifier();
            parseSemicolon();
            return finishNode(importDeclaration);
        }
        function parseImportClause(identifier, fullStart) {
            //ImportClause:
            //  ImportedDefaultBinding
            //  NameSpaceImport
            //  NamedImports
            //  ImportedDefaultBinding, NameSpaceImport
            //  ImportedDefaultBinding, NamedImports
            var importClause = createNode(210, fullStart);
            if (identifier) {
                importClause.name = identifier;
            }
            if (!importClause.name ||
                parseOptional(23)) {
                importClause.namedBindings = token === 35 ? parseNamespaceImport() : parseNamedImportsOrExports(212);
            }
            return finishNode(importClause);
        }
        function parseModuleReference() {
            return isExternalModuleReference()
                ? parseExternalModuleReference()
                : parseEntityName(false);
        }
        function parseExternalModuleReference() {
            var node = createNode(219);
            parseExpected(118);
            parseExpected(16);
            node.expression = parseModuleSpecifier();
            parseExpected(17);
            return finishNode(node);
        }
        function parseModuleSpecifier() {
            var result = parseExpression();
            if (result.kind === 8) {
                internIdentifier(result.text);
            }
            return result;
        }
        function parseNamespaceImport() {
            var namespaceImport = createNode(211);
            parseExpected(35);
            parseExpected(111);
            namespaceImport.name = parseIdentifier();
            return finishNode(namespaceImport);
        }
        function parseNamedImportsOrExports(kind) {
            var node = createNode(kind);
            node.elements = parseBracketedList(20, kind === 212 ? parseImportSpecifier : parseExportSpecifier, 14, 15);
            return finishNode(node);
        }
        function parseExportSpecifier() {
            return parseImportOrExportSpecifier(217);
        }
        function parseImportSpecifier() {
            return parseImportOrExportSpecifier(213);
        }
        function parseImportOrExportSpecifier(kind) {
            var node = createNode(kind);
            var checkIdentifierIsKeyword = ts.isKeyword(token) && !isIdentifier();
            var checkIdentifierStart = scanner.getTokenPos();
            var checkIdentifierEnd = scanner.getTextPos();
            var identifierName = parseIdentifierName();
            if (token === 111) {
                node.propertyName = identifierName;
                parseExpected(111);
                checkIdentifierIsKeyword = ts.isKeyword(token) && !isIdentifier();
                checkIdentifierStart = scanner.getTokenPos();
                checkIdentifierEnd = scanner.getTextPos();
                node.name = parseIdentifierName();
            }
            else {
                node.name = identifierName;
            }
            if (kind === 213 && checkIdentifierIsKeyword) {
                parseErrorAtPosition(checkIdentifierStart, checkIdentifierEnd - checkIdentifierStart, ts.Diagnostics.Identifier_expected);
            }
            return finishNode(node);
        }
        function parseExportDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(215, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            if (parseOptional(35)) {
                parseExpected(124);
                node.moduleSpecifier = parseModuleSpecifier();
            }
            else {
                node.exportClause = parseNamedImportsOrExports(216);
                if (parseOptional(124)) {
                    node.moduleSpecifier = parseModuleSpecifier();
                }
            }
            parseSemicolon();
            return finishNode(node);
        }
        function parseExportAssignment(fullStart, decorators, modifiers) {
            var node = createNode(214, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            if (parseOptional(53)) {
                node.isExportEquals = true;
            }
            else {
                parseExpected(73);
            }
            node.expression = parseAssignmentExpressionOrHigher();
            parseSemicolon();
            return finishNode(node);
        }
        function isLetDeclaration() {
            return inStrictModeContext() || lookAhead(nextTokenIsIdentifierOrStartOfDestructuringOnTheSameLine);
        }
        function isDeclarationStart(followsModifier) {
            switch (token) {
                case 98:
                case 70:
                case 83:
                    return true;
                case 104:
                    return isLetDeclaration();
                case 69:
                case 103:
                case 77:
                case 123:
                    return lookAhead(nextTokenIsIdentifierOrKeyword);
                case 85:
                    return lookAhead(nextTokenCanFollowImportKeyword);
                case 117:
                    return lookAhead(nextTokenIsIdentifierOrKeywordOrStringLiteral);
                case 78:
                    return lookAhead(nextTokenCanFollowExportKeyword);
                case 115:
                case 108:
                case 106:
                case 107:
                case 109:
                    return lookAhead(nextTokenIsDeclarationStart);
                case 52:
                    return !followsModifier;
            }
        }
        function isIdentifierOrKeyword() {
            return token >= 65;
        }
        function nextTokenIsIdentifierOrKeyword() {
            nextToken();
            return isIdentifierOrKeyword();
        }
        function nextTokenIsIdentifierOrKeywordOrStringLiteral() {
            nextToken();
            return isIdentifierOrKeyword() || token === 8;
        }
        function nextTokenCanFollowImportKeyword() {
            nextToken();
            return isIdentifierOrKeyword() || token === 8 ||
                token === 35 || token === 14;
        }
        function nextTokenCanFollowExportKeyword() {
            nextToken();
            return token === 53 || token === 35 ||
                token === 14 || token === 73 || isDeclarationStart(true);
        }
        function nextTokenIsDeclarationStart() {
            nextToken();
            return isDeclarationStart(true);
        }
        function nextTokenIsAsKeyword() {
            return nextToken() === 111;
        }
        function parseDeclaration() {
            var fullStart = getNodePos();
            var decorators = parseDecorators();
            var modifiers = parseModifiers();
            if (token === 78) {
                nextToken();
                if (token === 73 || token === 53) {
                    return parseExportAssignment(fullStart, decorators, modifiers);
                }
                if (token === 35 || token === 14) {
                    return parseExportDeclaration(fullStart, decorators, modifiers);
                }
            }
            switch (token) {
                case 98:
                case 104:
                case 70:
                    return parseVariableStatement(fullStart, decorators, modifiers);
                case 83:
                    return parseFunctionDeclaration(fullStart, decorators, modifiers);
                case 69:
                    return parseClassDeclaration(fullStart, decorators, modifiers);
                case 103:
                    return parseInterfaceDeclaration(fullStart, decorators, modifiers);
                case 123:
                    return parseTypeAliasDeclaration(fullStart, decorators, modifiers);
                case 77:
                    return parseEnumDeclaration(fullStart, decorators, modifiers);
                case 117:
                    return parseModuleDeclaration(fullStart, decorators, modifiers);
                case 85:
                    return parseImportDeclarationOrImportEqualsDeclaration(fullStart, decorators, modifiers);
                default:
                    if (decorators) {
                        var node = createMissingNode(218, true, ts.Diagnostics.Declaration_expected);
                        node.pos = fullStart;
                        node.decorators = decorators;
                        setModifiers(node, modifiers);
                        return finishNode(node);
                    }
                    ts.Debug.fail("Mismatch between isDeclarationStart and parseDeclaration");
            }
        }
        function isSourceElement(inErrorRecovery) {
            return isDeclarationStart() || isStartOfStatement(inErrorRecovery);
        }
        function parseSourceElement() {
            return parseSourceElementOrModuleElement();
        }
        function parseModuleElement() {
            return parseSourceElementOrModuleElement();
        }
        function parseSourceElementOrModuleElement() {
            return isDeclarationStart()
                ? parseDeclaration()
                : parseStatement();
        }
        function processReferenceComments(sourceFile) {
            var triviaScanner = ts.createScanner(sourceFile.languageVersion, false, sourceText);
            var referencedFiles = [];
            var amdDependencies = [];
            var amdModuleName;
            while (true) {
                var kind = triviaScanner.scan();
                if (kind === 5 || kind === 4 || kind === 3) {
                    continue;
                }
                if (kind !== 2) {
                    break;
                }
                var range = { pos: triviaScanner.getTokenPos(), end: triviaScanner.getTextPos(), kind: triviaScanner.getToken() };
                var comment = sourceText.substring(range.pos, range.end);
                var referencePathMatchResult = ts.getFileReferenceFromReferencePath(comment, range);
                if (referencePathMatchResult) {
                    var fileReference = referencePathMatchResult.fileReference;
                    sourceFile.hasNoDefaultLib = referencePathMatchResult.isNoDefaultLib;
                    var diagnosticMessage = referencePathMatchResult.diagnosticMessage;
                    if (fileReference) {
                        referencedFiles.push(fileReference);
                    }
                    if (diagnosticMessage) {
                        sourceFile.parseDiagnostics.push(ts.createFileDiagnostic(sourceFile, range.pos, range.end - range.pos, diagnosticMessage));
                    }
                }
                else {
                    var amdModuleNameRegEx = /^\/\/\/\s*<amd-module\s+name\s*=\s*('|")(.+?)\1/gim;
                    var amdModuleNameMatchResult = amdModuleNameRegEx.exec(comment);
                    if (amdModuleNameMatchResult) {
                        if (amdModuleName) {
                            sourceFile.parseDiagnostics.push(ts.createFileDiagnostic(sourceFile, range.pos, range.end - range.pos, ts.Diagnostics.An_AMD_module_cannot_have_multiple_name_assignments));
                        }
                        amdModuleName = amdModuleNameMatchResult[2];
                    }
                    var amdDependencyRegEx = /^\/\/\/\s*<amd-dependency\s/gim;
                    var pathRegex = /\spath\s*=\s*('|")(.+?)\1/gim;
                    var nameRegex = /\sname\s*=\s*('|")(.+?)\1/gim;
                    var amdDependencyMatchResult = amdDependencyRegEx.exec(comment);
                    if (amdDependencyMatchResult) {
                        var pathMatchResult = pathRegex.exec(comment);
                        var nameMatchResult = nameRegex.exec(comment);
                        if (pathMatchResult) {
                            var amdDependency = { path: pathMatchResult[2], name: nameMatchResult ? nameMatchResult[2] : undefined };
                            amdDependencies.push(amdDependency);
                        }
                    }
                }
            }
            sourceFile.referencedFiles = referencedFiles;
            sourceFile.amdDependencies = amdDependencies;
            sourceFile.amdModuleName = amdModuleName;
        }
        function setExternalModuleIndicator(sourceFile) {
            sourceFile.externalModuleIndicator = ts.forEach(sourceFile.statements, function (node) {
                return node.flags & 1
                    || node.kind === 208 && node.moduleReference.kind === 219
                    || node.kind === 209
                    || node.kind === 214
                    || node.kind === 215
                    ? node
                    : undefined;
            });
        }
        var ParsingContext;
        (function (ParsingContext) {
            ParsingContext[ParsingContext["SourceElements"] = 0] = "SourceElements";
            ParsingContext[ParsingContext["ModuleElements"] = 1] = "ModuleElements";
            ParsingContext[ParsingContext["BlockStatements"] = 2] = "BlockStatements";
            ParsingContext[ParsingContext["SwitchClauses"] = 3] = "SwitchClauses";
            ParsingContext[ParsingContext["SwitchClauseStatements"] = 4] = "SwitchClauseStatements";
            ParsingContext[ParsingContext["TypeMembers"] = 5] = "TypeMembers";
            ParsingContext[ParsingContext["ClassMembers"] = 6] = "ClassMembers";
            ParsingContext[ParsingContext["EnumMembers"] = 7] = "EnumMembers";
            ParsingContext[ParsingContext["HeritageClauseElement"] = 8] = "HeritageClauseElement";
            ParsingContext[ParsingContext["VariableDeclarations"] = 9] = "VariableDeclarations";
            ParsingContext[ParsingContext["ObjectBindingElements"] = 10] = "ObjectBindingElements";
            ParsingContext[ParsingContext["ArrayBindingElements"] = 11] = "ArrayBindingElements";
            ParsingContext[ParsingContext["ArgumentExpressions"] = 12] = "ArgumentExpressions";
            ParsingContext[ParsingContext["ObjectLiteralMembers"] = 13] = "ObjectLiteralMembers";
            ParsingContext[ParsingContext["ArrayLiteralMembers"] = 14] = "ArrayLiteralMembers";
            ParsingContext[ParsingContext["Parameters"] = 15] = "Parameters";
            ParsingContext[ParsingContext["TypeParameters"] = 16] = "TypeParameters";
            ParsingContext[ParsingContext["TypeArguments"] = 17] = "TypeArguments";
            ParsingContext[ParsingContext["TupleElementTypes"] = 18] = "TupleElementTypes";
            ParsingContext[ParsingContext["HeritageClauses"] = 19] = "HeritageClauses";
            ParsingContext[ParsingContext["ImportOrExportSpecifiers"] = 20] = "ImportOrExportSpecifiers";
            ParsingContext[ParsingContext["Count"] = 21] = "Count";
        })(ParsingContext || (ParsingContext = {}));
        var Tristate;
        (function (Tristate) {
            Tristate[Tristate["False"] = 0] = "False";
            Tristate[Tristate["True"] = 1] = "True";
            Tristate[Tristate["Unknown"] = 2] = "Unknown";
        })(Tristate || (Tristate = {}));
    })(Parser || (Parser = {}));
    var IncrementalParser;
    (function (IncrementalParser) {
        function updateSourceFile(sourceFile, newText, textChangeRange, aggressiveChecks) {
            aggressiveChecks = aggressiveChecks || ts.Debug.shouldAssert(2);
            checkChangeRange(sourceFile, newText, textChangeRange, aggressiveChecks);
            if (ts.textChangeRangeIsUnchanged(textChangeRange)) {
                return sourceFile;
            }
            if (sourceFile.statements.length === 0) {
                return Parser.parseSourceFile(sourceFile.fileName, newText, sourceFile.languageVersion, undefined, true);
            }
            var incrementalSourceFile = sourceFile;
            ts.Debug.assert(!incrementalSourceFile.hasBeenIncrementallyParsed);
            incrementalSourceFile.hasBeenIncrementallyParsed = true;
            var oldText = sourceFile.text;
            var syntaxCursor = createSyntaxCursor(sourceFile);
            var changeRange = extendToAffectedRange(sourceFile, textChangeRange);
            checkChangeRange(sourceFile, newText, changeRange, aggressiveChecks);
            ts.Debug.assert(changeRange.span.start <= textChangeRange.span.start);
            ts.Debug.assert(ts.textSpanEnd(changeRange.span) === ts.textSpanEnd(textChangeRange.span));
            ts.Debug.assert(ts.textSpanEnd(ts.textChangeRangeNewSpan(changeRange)) === ts.textSpanEnd(ts.textChangeRangeNewSpan(textChangeRange)));
            var delta = ts.textChangeRangeNewSpan(changeRange).length - changeRange.span.length;
            updateTokenPositionsAndMarkElements(incrementalSourceFile, changeRange.span.start, ts.textSpanEnd(changeRange.span), ts.textSpanEnd(ts.textChangeRangeNewSpan(changeRange)), delta, oldText, newText, aggressiveChecks);
            var result = Parser.parseSourceFile(sourceFile.fileName, newText, sourceFile.languageVersion, syntaxCursor, true);
            return result;
        }
        IncrementalParser.updateSourceFile = updateSourceFile;
        function moveElementEntirelyPastChangeRange(element, isArray, delta, oldText, newText, aggressiveChecks) {
            if (isArray) {
                visitArray(element);
            }
            else {
                visitNode(element);
            }
            return;
            function visitNode(node) {
                if (aggressiveChecks && shouldCheckNode(node)) {
                    var text = oldText.substring(node.pos, node.end);
                }
                node._children = undefined;
                node.pos += delta;
                node.end += delta;
                if (aggressiveChecks && shouldCheckNode(node)) {
                    ts.Debug.assert(text === newText.substring(node.pos, node.end));
                }
                forEachChild(node, visitNode, visitArray);
                checkNodePositions(node, aggressiveChecks);
            }
            function visitArray(array) {
                array._children = undefined;
                array.pos += delta;
                array.end += delta;
                for (var _i = 0; _i < array.length; _i++) {
                    var node = array[_i];
                    visitNode(node);
                }
            }
        }
        function shouldCheckNode(node) {
            switch (node.kind) {
                case 8:
                case 7:
                case 65:
                    return true;
            }
            return false;
        }
        function adjustIntersectingElement(element, changeStart, changeRangeOldEnd, changeRangeNewEnd, delta) {
            ts.Debug.assert(element.end >= changeStart, "Adjusting an element that was entirely before the change range");
            ts.Debug.assert(element.pos <= changeRangeOldEnd, "Adjusting an element that was entirely after the change range");
            ts.Debug.assert(element.pos <= element.end);
            element.pos = Math.min(element.pos, changeRangeNewEnd);
            if (element.end >= changeRangeOldEnd) {
                element.end += delta;
            }
            else {
                element.end = Math.min(element.end, changeRangeNewEnd);
            }
            ts.Debug.assert(element.pos <= element.end);
            if (element.parent) {
                ts.Debug.assert(element.pos >= element.parent.pos);
                ts.Debug.assert(element.end <= element.parent.end);
            }
        }
        function checkNodePositions(node, aggressiveChecks) {
            if (aggressiveChecks) {
                var pos = node.pos;
                forEachChild(node, function (child) {
                    ts.Debug.assert(child.pos >= pos);
                    pos = child.end;
                });
                ts.Debug.assert(pos <= node.end);
            }
        }
        function updateTokenPositionsAndMarkElements(sourceFile, changeStart, changeRangeOldEnd, changeRangeNewEnd, delta, oldText, newText, aggressiveChecks) {
            visitNode(sourceFile);
            return;
            function visitNode(child) {
                ts.Debug.assert(child.pos <= child.end);
                if (child.pos > changeRangeOldEnd) {
                    moveElementEntirelyPastChangeRange(child, false, delta, oldText, newText, aggressiveChecks);
                    return;
                }
                var fullEnd = child.end;
                if (fullEnd >= changeStart) {
                    child.intersectsChange = true;
                    child._children = undefined;
                    adjustIntersectingElement(child, changeStart, changeRangeOldEnd, changeRangeNewEnd, delta);
                    forEachChild(child, visitNode, visitArray);
                    checkNodePositions(child, aggressiveChecks);
                    return;
                }
                ts.Debug.assert(fullEnd < changeStart);
            }
            function visitArray(array) {
                ts.Debug.assert(array.pos <= array.end);
                if (array.pos > changeRangeOldEnd) {
                    moveElementEntirelyPastChangeRange(array, true, delta, oldText, newText, aggressiveChecks);
                    return;
                }
                var fullEnd = array.end;
                if (fullEnd >= changeStart) {
                    array.intersectsChange = true;
                    array._children = undefined;
                    adjustIntersectingElement(array, changeStart, changeRangeOldEnd, changeRangeNewEnd, delta);
                    for (var _i = 0; _i < array.length; _i++) {
                        var node = array[_i];
                        visitNode(node);
                    }
                    return;
                }
                ts.Debug.assert(fullEnd < changeStart);
            }
        }
        function extendToAffectedRange(sourceFile, changeRange) {
            var maxLookahead = 1;
            var start = changeRange.span.start;
            for (var i = 0; start > 0 && i <= maxLookahead; i++) {
                var nearestNode = findNearestNodeStartingBeforeOrAtPosition(sourceFile, start);
                ts.Debug.assert(nearestNode.pos <= start);
                var position = nearestNode.pos;
                start = Math.max(0, position - 1);
            }
            var finalSpan = ts.createTextSpanFromBounds(start, ts.textSpanEnd(changeRange.span));
            var finalLength = changeRange.newLength + (changeRange.span.start - start);
            return ts.createTextChangeRange(finalSpan, finalLength);
        }
        function findNearestNodeStartingBeforeOrAtPosition(sourceFile, position) {
            var bestResult = sourceFile;
            var lastNodeEntirelyBeforePosition;
            forEachChild(sourceFile, visit);
            if (lastNodeEntirelyBeforePosition) {
                var lastChildOfLastEntireNodeBeforePosition = getLastChild(lastNodeEntirelyBeforePosition);
                if (lastChildOfLastEntireNodeBeforePosition.pos > bestResult.pos) {
                    bestResult = lastChildOfLastEntireNodeBeforePosition;
                }
            }
            return bestResult;
            function getLastChild(node) {
                while (true) {
                    var lastChild = getLastChildWorker(node);
                    if (lastChild) {
                        node = lastChild;
                    }
                    else {
                        return node;
                    }
                }
            }
            function getLastChildWorker(node) {
                var last = undefined;
                forEachChild(node, function (child) {
                    if (ts.nodeIsPresent(child)) {
                        last = child;
                    }
                });
                return last;
            }
            function visit(child) {
                if (ts.nodeIsMissing(child)) {
                    return;
                }
                if (child.pos <= position) {
                    if (child.pos >= bestResult.pos) {
                        bestResult = child;
                    }
                    if (position < child.end) {
                        forEachChild(child, visit);
                        return true;
                    }
                    else {
                        ts.Debug.assert(child.end <= position);
                        lastNodeEntirelyBeforePosition = child;
                    }
                }
                else {
                    ts.Debug.assert(child.pos > position);
                    return true;
                }
            }
        }
        function checkChangeRange(sourceFile, newText, textChangeRange, aggressiveChecks) {
            var oldText = sourceFile.text;
            if (textChangeRange) {
                ts.Debug.assert((oldText.length - textChangeRange.span.length + textChangeRange.newLength) === newText.length);
                if (aggressiveChecks || ts.Debug.shouldAssert(3)) {
                    var oldTextPrefix = oldText.substr(0, textChangeRange.span.start);
                    var newTextPrefix = newText.substr(0, textChangeRange.span.start);
                    ts.Debug.assert(oldTextPrefix === newTextPrefix);
                    var oldTextSuffix = oldText.substring(ts.textSpanEnd(textChangeRange.span), oldText.length);
                    var newTextSuffix = newText.substring(ts.textSpanEnd(ts.textChangeRangeNewSpan(textChangeRange)), newText.length);
                    ts.Debug.assert(oldTextSuffix === newTextSuffix);
                }
            }
        }
        function createSyntaxCursor(sourceFile) {
            var currentArray = sourceFile.statements;
            var currentArrayIndex = 0;
            ts.Debug.assert(currentArrayIndex < currentArray.length);
            var current = currentArray[currentArrayIndex];
            var lastQueriedPosition = -1;
            return {
                currentNode: function (position) {
                    if (position !== lastQueriedPosition) {
                        if (current && current.end === position && currentArrayIndex < (currentArray.length - 1)) {
                            currentArrayIndex++;
                            current = currentArray[currentArrayIndex];
                        }
                        if (!current || current.pos !== position) {
                            findHighestListElementThatStartsAtPosition(position);
                        }
                    }
                    lastQueriedPosition = position;
                    ts.Debug.assert(!current || current.pos === position);
                    return current;
                }
            };
            function findHighestListElementThatStartsAtPosition(position) {
                currentArray = undefined;
                currentArrayIndex = -1;
                current = undefined;
                forEachChild(sourceFile, visitNode, visitArray);
                return;
                function visitNode(node) {
                    if (position >= node.pos && position < node.end) {
                        forEachChild(node, visitNode, visitArray);
                        return true;
                    }
                    return false;
                }
                function visitArray(array) {
                    if (position >= array.pos && position < array.end) {
                        for (var i = 0, n = array.length; i < n; i++) {
                            var child = array[i];
                            if (child) {
                                if (child.pos === position) {
                                    currentArray = array;
                                    currentArrayIndex = i;
                                    current = child;
                                    return true;
                                }
                                else {
                                    if (child.pos < position && position < child.end) {
                                        forEachChild(child, visitNode, visitArray);
                                        return true;
                                    }
                                }
                            }
                        }
                    }
                    return false;
                }
            }
        }
        var InvalidPosition;
        (function (InvalidPosition) {
            InvalidPosition[InvalidPosition["Value"] = -1] = "Value";
        })(InvalidPosition || (InvalidPosition = {}));
    })(IncrementalParser || (IncrementalParser = {}));
})(ts || (ts = {}));
