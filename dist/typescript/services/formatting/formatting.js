///<reference path='..\services.ts' />
///<reference path='formattingScanner.ts' />
///<reference path='rulesProvider.ts' />
///<reference path='references.ts' />
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var Constants;
        (function (Constants) {
            Constants[Constants["Unknown"] = -1] = "Unknown";
        })(Constants || (Constants = {}));
        function formatOnEnter(position, sourceFile, rulesProvider, options) {
            var line = sourceFile.getLineAndCharacterOfPosition(position).line;
            if (line === 0) {
                return [];
            }
            var span = {
                pos: ts.getStartPositionOfLine(line - 1, sourceFile),
                end: ts.getEndLinePosition(line, sourceFile) + 1
            };
            return formatSpan(span, sourceFile, options, rulesProvider, 2);
        }
        formatting.formatOnEnter = formatOnEnter;
        function formatOnSemicolon(position, sourceFile, rulesProvider, options) {
            return formatOutermostParent(position, 22, sourceFile, options, rulesProvider, 3);
        }
        formatting.formatOnSemicolon = formatOnSemicolon;
        function formatOnClosingCurly(position, sourceFile, rulesProvider, options) {
            return formatOutermostParent(position, 15, sourceFile, options, rulesProvider, 4);
        }
        formatting.formatOnClosingCurly = formatOnClosingCurly;
        function formatDocument(sourceFile, rulesProvider, options) {
            var span = {
                pos: 0,
                end: sourceFile.text.length
            };
            return formatSpan(span, sourceFile, options, rulesProvider, 0);
        }
        formatting.formatDocument = formatDocument;
        function formatSelection(start, end, sourceFile, rulesProvider, options) {
            var span = {
                pos: ts.getLineStartPositionForPosition(start, sourceFile),
                end: end
            };
            return formatSpan(span, sourceFile, options, rulesProvider, 1);
        }
        formatting.formatSelection = formatSelection;
        function formatOutermostParent(position, expectedLastToken, sourceFile, options, rulesProvider, requestKind) {
            var parent = findOutermostParent(position, expectedLastToken, sourceFile);
            if (!parent) {
                return [];
            }
            var span = {
                pos: ts.getLineStartPositionForPosition(parent.getStart(sourceFile), sourceFile),
                end: parent.end
            };
            return formatSpan(span, sourceFile, options, rulesProvider, requestKind);
        }
        function findOutermostParent(position, expectedTokenKind, sourceFile) {
            var precedingToken = ts.findPrecedingToken(position, sourceFile);
            if (!precedingToken ||
                precedingToken.kind !== expectedTokenKind ||
                position !== precedingToken.getEnd()) {
                return undefined;
            }
            var current = precedingToken;
            while (current &&
                current.parent &&
                current.parent.end === precedingToken.end &&
                !isListElement(current.parent, current)) {
                current = current.parent;
            }
            return current;
        }
        function isListElement(parent, node) {
            switch (parent.kind) {
                case 201:
                case 202:
                    return ts.rangeContainsRange(parent.members, node);
                case 205:
                    var body = parent.body;
                    return body && body.kind === 179 && ts.rangeContainsRange(body.statements, node);
                case 227:
                case 179:
                case 206:
                    return ts.rangeContainsRange(parent.statements, node);
                case 223:
                    return ts.rangeContainsRange(parent.block.statements, node);
            }
            return false;
        }
        function findEnclosingNode(range, sourceFile) {
            return find(sourceFile);
            function find(n) {
                var candidate = ts.forEachChild(n, function (c) { return ts.startEndContainsRange(c.getStart(sourceFile), c.end, range) && c; });
                if (candidate) {
                    var result = find(candidate);
                    if (result) {
                        return result;
                    }
                }
                return n;
            }
        }
        function prepareRangeContainsErrorFunction(errors, originalRange) {
            if (!errors.length) {
                return rangeHasNoErrors;
            }
            var sorted = errors
                .filter(function (d) { return ts.rangeOverlapsWithStartEnd(originalRange, d.start, d.start + d.length); })
                .sort(function (e1, e2) { return e1.start - e2.start; });
            if (!sorted.length) {
                return rangeHasNoErrors;
            }
            var index = 0;
            return function (r) {
                while (true) {
                    if (index >= sorted.length) {
                        return false;
                    }
                    var error = sorted[index];
                    if (r.end <= error.start) {
                        return false;
                    }
                    if (ts.startEndOverlapsWithStartEnd(r.pos, r.end, error.start, error.start + error.length)) {
                        return true;
                    }
                    index++;
                }
            };
            function rangeHasNoErrors(r) {
                return false;
            }
        }
        function getScanStartPosition(enclosingNode, originalRange, sourceFile) {
            var start = enclosingNode.getStart(sourceFile);
            if (start === originalRange.pos && enclosingNode.end === originalRange.end) {
                return start;
            }
            var precedingToken = ts.findPrecedingToken(originalRange.pos, sourceFile);
            if (!precedingToken) {
                return enclosingNode.pos;
            }
            if (precedingToken.end >= originalRange.pos) {
                return enclosingNode.pos;
            }
            return precedingToken.end;
        }
        function getOwnOrInheritedDelta(n, options, sourceFile) {
            var previousLine = -1;
            var childKind = 0;
            while (n) {
                var line = sourceFile.getLineAndCharacterOfPosition(n.getStart(sourceFile)).line;
                if (previousLine !== -1 && line !== previousLine) {
                    break;
                }
                if (formatting.SmartIndenter.shouldIndentChildNode(n.kind, childKind)) {
                    return options.IndentSize;
                }
                previousLine = line;
                childKind = n.kind;
                n = n.parent;
            }
            return 0;
        }
        function formatSpan(originalRange, sourceFile, options, rulesProvider, requestKind) {
            var rangeContainsError = prepareRangeContainsErrorFunction(sourceFile.parseDiagnostics, originalRange);
            var formattingContext = new formatting.FormattingContext(sourceFile, requestKind);
            var enclosingNode = findEnclosingNode(originalRange, sourceFile);
            var formattingScanner = formatting.getFormattingScanner(sourceFile, getScanStartPosition(enclosingNode, originalRange, sourceFile), originalRange.end);
            var initialIndentation = formatting.SmartIndenter.getIndentationForNode(enclosingNode, originalRange, sourceFile, options);
            var previousRangeHasError;
            var previousRange;
            var previousParent;
            var previousRangeStartLine;
            var edits = [];
            formattingScanner.advance();
            if (formattingScanner.isOnToken()) {
                var startLine = sourceFile.getLineAndCharacterOfPosition(enclosingNode.getStart(sourceFile)).line;
                var undecoratedStartLine = startLine;
                if (enclosingNode.decorators) {
                    undecoratedStartLine = sourceFile.getLineAndCharacterOfPosition(ts.getNonDecoratorTokenPosOfNode(enclosingNode, sourceFile)).line;
                }
                var delta = getOwnOrInheritedDelta(enclosingNode, options, sourceFile);
                processNode(enclosingNode, enclosingNode, startLine, undecoratedStartLine, initialIndentation, delta);
            }
            formattingScanner.close();
            return edits;
            function tryComputeIndentationForListItem(startPos, endPos, parentStartLine, range, inheritedIndentation) {
                if (ts.rangeOverlapsWithStartEnd(range, startPos, endPos)) {
                    if (inheritedIndentation !== -1) {
                        return inheritedIndentation;
                    }
                }
                else {
                    var startLine = sourceFile.getLineAndCharacterOfPosition(startPos).line;
                    var startLinePosition = ts.getLineStartPositionForPosition(startPos, sourceFile);
                    var column = formatting.SmartIndenter.findFirstNonWhitespaceColumn(startLinePosition, startPos, sourceFile, options);
                    if (startLine !== parentStartLine || startPos === column) {
                        return column;
                    }
                }
                return -1;
            }
            function computeIndentation(node, startLine, inheritedIndentation, parent, parentDynamicIndentation, effectiveParentStartLine) {
                var indentation = inheritedIndentation;
                if (indentation === -1) {
                    if (isSomeBlock(node.kind)) {
                        if (isSomeBlock(parent.kind) ||
                            parent.kind === 227 ||
                            parent.kind === 220 ||
                            parent.kind === 221) {
                            indentation = parentDynamicIndentation.getIndentation() + parentDynamicIndentation.getDelta();
                        }
                        else {
                            indentation = parentDynamicIndentation.getIndentation();
                        }
                    }
                    else {
                        if (formatting.SmartIndenter.childStartsOnTheSameLineWithElseInIfStatement(parent, node, startLine, sourceFile)) {
                            indentation = parentDynamicIndentation.getIndentation();
                        }
                        else {
                            indentation = parentDynamicIndentation.getIndentation() + parentDynamicIndentation.getDelta();
                        }
                    }
                }
                var delta = formatting.SmartIndenter.shouldIndentChildNode(node.kind, 0) ? options.IndentSize : 0;
                if (effectiveParentStartLine === startLine) {
                    indentation = parentDynamicIndentation.getIndentation();
                    delta = Math.min(options.IndentSize, parentDynamicIndentation.getDelta() + delta);
                }
                return {
                    indentation: indentation,
                    delta: delta
                };
            }
            function getFirstNonDecoratorTokenOfNode(node) {
                if (node.modifiers && node.modifiers.length) {
                    return node.modifiers[0].kind;
                }
                switch (node.kind) {
                    case 201: return 69;
                    case 202: return 103;
                    case 200: return 83;
                    case 204: return 204;
                    case 136: return 116;
                    case 137: return 120;
                    case 134:
                        if (node.asteriskToken) {
                            return 35;
                        }
                    case 132:
                    case 129:
                        return node.name.kind;
                }
            }
            function getDynamicIndentation(node, nodeStartLine, indentation, delta) {
                return {
                    getIndentationForComment: function (kind) {
                        switch (kind) {
                            case 15:
                            case 19:
                                return indentation + delta;
                        }
                        return indentation;
                    },
                    getIndentationForToken: function (line, kind) {
                        if (nodeStartLine !== line && node.decorators) {
                            if (kind === getFirstNonDecoratorTokenOfNode(node)) {
                                return indentation;
                            }
                        }
                        switch (kind) {
                            case 14:
                            case 15:
                            case 18:
                            case 19:
                            case 76:
                            case 100:
                            case 52:
                                return indentation;
                            default:
                                return nodeStartLine !== line ? indentation + delta : indentation;
                        }
                    },
                    getIndentation: function () { return indentation; },
                    getDelta: function () { return delta; },
                    recomputeIndentation: function (lineAdded) {
                        if (node.parent && formatting.SmartIndenter.shouldIndentChildNode(node.parent.kind, node.kind)) {
                            if (lineAdded) {
                                indentation += options.IndentSize;
                            }
                            else {
                                indentation -= options.IndentSize;
                            }
                            if (formatting.SmartIndenter.shouldIndentChildNode(node.kind, 0)) {
                                delta = options.IndentSize;
                            }
                            else {
                                delta = 0;
                            }
                        }
                    },
                };
            }
            function processNode(node, contextNode, nodeStartLine, undecoratedNodeStartLine, indentation, delta) {
                if (!ts.rangeOverlapsWithStartEnd(originalRange, node.getStart(sourceFile), node.getEnd())) {
                    return;
                }
                var nodeDynamicIndentation = getDynamicIndentation(node, nodeStartLine, indentation, delta);
                var childContextNode = contextNode;
                ts.forEachChild(node, function (child) {
                    processChildNode(child, -1, node, nodeDynamicIndentation, nodeStartLine, undecoratedNodeStartLine, false);
                }, function (nodes) {
                    processChildNodes(nodes, node, nodeStartLine, nodeDynamicIndentation);
                });
                while (formattingScanner.isOnToken()) {
                    var tokenInfo = formattingScanner.readTokenInfo(node);
                    if (tokenInfo.token.end > node.end) {
                        break;
                    }
                    consumeTokenAndAdvanceScanner(tokenInfo, node, nodeDynamicIndentation);
                }
                function processChildNode(child, inheritedIndentation, parent, parentDynamicIndentation, parentStartLine, undecoratedParentStartLine, isListItem) {
                    var childStartPos = child.getStart(sourceFile);
                    var childStartLine = sourceFile.getLineAndCharacterOfPosition(childStartPos).line;
                    var undecoratedChildStartLine = childStartLine;
                    if (child.decorators) {
                        undecoratedChildStartLine = sourceFile.getLineAndCharacterOfPosition(ts.getNonDecoratorTokenPosOfNode(child, sourceFile)).line;
                    }
                    var childIndentationAmount = -1;
                    if (isListItem) {
                        childIndentationAmount = tryComputeIndentationForListItem(childStartPos, child.end, parentStartLine, originalRange, inheritedIndentation);
                        if (childIndentationAmount !== -1) {
                            inheritedIndentation = childIndentationAmount;
                        }
                    }
                    if (!ts.rangeOverlapsWithStartEnd(originalRange, child.pos, child.end)) {
                        return inheritedIndentation;
                    }
                    if (child.getFullWidth() === 0) {
                        return inheritedIndentation;
                    }
                    while (formattingScanner.isOnToken()) {
                        var tokenInfo = formattingScanner.readTokenInfo(node);
                        if (tokenInfo.token.end > childStartPos) {
                            break;
                        }
                        consumeTokenAndAdvanceScanner(tokenInfo, node, parentDynamicIndentation);
                    }
                    if (!formattingScanner.isOnToken()) {
                        return inheritedIndentation;
                    }
                    if (ts.isToken(child)) {
                        var tokenInfo = formattingScanner.readTokenInfo(child);
                        ts.Debug.assert(tokenInfo.token.end === child.end);
                        consumeTokenAndAdvanceScanner(tokenInfo, node, parentDynamicIndentation);
                        return inheritedIndentation;
                    }
                    var effectiveParentStartLine = child.kind === 130 ? childStartLine : undecoratedParentStartLine;
                    var childIndentation = computeIndentation(child, childStartLine, childIndentationAmount, node, parentDynamicIndentation, effectiveParentStartLine);
                    processNode(child, childContextNode, childStartLine, undecoratedChildStartLine, childIndentation.indentation, childIndentation.delta);
                    childContextNode = node;
                    return inheritedIndentation;
                }
                function processChildNodes(nodes, parent, parentStartLine, parentDynamicIndentation) {
                    var listStartToken = getOpenTokenForList(parent, nodes);
                    var listEndToken = getCloseTokenForOpenToken(listStartToken);
                    var listDynamicIndentation = parentDynamicIndentation;
                    var startLine = parentStartLine;
                    if (listStartToken !== 0) {
                        while (formattingScanner.isOnToken()) {
                            var tokenInfo = formattingScanner.readTokenInfo(parent);
                            if (tokenInfo.token.end > nodes.pos) {
                                break;
                            }
                            else if (tokenInfo.token.kind === listStartToken) {
                                startLine = sourceFile.getLineAndCharacterOfPosition(tokenInfo.token.pos).line;
                                var indentation_1 = computeIndentation(tokenInfo.token, startLine, -1, parent, parentDynamicIndentation, startLine);
                                listDynamicIndentation = getDynamicIndentation(parent, parentStartLine, indentation_1.indentation, indentation_1.delta);
                                consumeTokenAndAdvanceScanner(tokenInfo, parent, listDynamicIndentation);
                            }
                            else {
                                consumeTokenAndAdvanceScanner(tokenInfo, parent, parentDynamicIndentation);
                            }
                        }
                    }
                    var inheritedIndentation = -1;
                    for (var _i = 0; _i < nodes.length; _i++) {
                        var child = nodes[_i];
                        inheritedIndentation = processChildNode(child, inheritedIndentation, node, listDynamicIndentation, startLine, startLine, true);
                    }
                    if (listEndToken !== 0) {
                        if (formattingScanner.isOnToken()) {
                            var tokenInfo = formattingScanner.readTokenInfo(parent);
                            if (tokenInfo.token.kind === listEndToken && ts.rangeContainsRange(parent, tokenInfo.token)) {
                                consumeTokenAndAdvanceScanner(tokenInfo, parent, listDynamicIndentation);
                            }
                        }
                    }
                }
                function consumeTokenAndAdvanceScanner(currentTokenInfo, parent, dynamicIndentation) {
                    ts.Debug.assert(ts.rangeContainsRange(parent, currentTokenInfo.token));
                    var lastTriviaWasNewLine = formattingScanner.lastTrailingTriviaWasNewLine();
                    var indentToken = false;
                    if (currentTokenInfo.leadingTrivia) {
                        processTrivia(currentTokenInfo.leadingTrivia, parent, childContextNode, dynamicIndentation);
                    }
                    var lineAdded;
                    var isTokenInRange = ts.rangeContainsRange(originalRange, currentTokenInfo.token);
                    var tokenStart = sourceFile.getLineAndCharacterOfPosition(currentTokenInfo.token.pos);
                    if (isTokenInRange) {
                        var rangeHasError = rangeContainsError(currentTokenInfo.token);
                        var prevStartLine = previousRangeStartLine;
                        lineAdded = processRange(currentTokenInfo.token, tokenStart, parent, childContextNode, dynamicIndentation);
                        if (rangeHasError) {
                            indentToken = false;
                        }
                        else {
                            if (lineAdded !== undefined) {
                                indentToken = lineAdded;
                            }
                            else {
                                indentToken = lastTriviaWasNewLine && tokenStart.line !== prevStartLine;
                            }
                        }
                    }
                    if (currentTokenInfo.trailingTrivia) {
                        processTrivia(currentTokenInfo.trailingTrivia, parent, childContextNode, dynamicIndentation);
                    }
                    if (indentToken) {
                        var indentNextTokenOrTrivia = true;
                        if (currentTokenInfo.leadingTrivia) {
                            for (var _i = 0, _a = currentTokenInfo.leadingTrivia; _i < _a.length; _i++) {
                                var triviaItem = _a[_i];
                                if (!ts.rangeContainsRange(originalRange, triviaItem)) {
                                    continue;
                                }
                                var triviaStartLine = sourceFile.getLineAndCharacterOfPosition(triviaItem.pos).line;
                                switch (triviaItem.kind) {
                                    case 3:
                                        var commentIndentation = dynamicIndentation.getIndentationForComment(currentTokenInfo.token.kind);
                                        indentMultilineComment(triviaItem, commentIndentation, !indentNextTokenOrTrivia);
                                        indentNextTokenOrTrivia = false;
                                        break;
                                    case 2:
                                        if (indentNextTokenOrTrivia) {
                                            var commentIndentation_1 = dynamicIndentation.getIndentationForComment(currentTokenInfo.token.kind);
                                            insertIndentation(triviaItem.pos, commentIndentation_1, false);
                                            indentNextTokenOrTrivia = false;
                                        }
                                        break;
                                    case 4:
                                        indentNextTokenOrTrivia = true;
                                        break;
                                }
                            }
                        }
                        if (isTokenInRange && !rangeContainsError(currentTokenInfo.token)) {
                            var tokenIndentation = dynamicIndentation.getIndentationForToken(tokenStart.line, currentTokenInfo.token.kind);
                            insertIndentation(currentTokenInfo.token.pos, tokenIndentation, lineAdded);
                        }
                    }
                    formattingScanner.advance();
                    childContextNode = parent;
                }
            }
            function processTrivia(trivia, parent, contextNode, dynamicIndentation) {
                for (var _i = 0; _i < trivia.length; _i++) {
                    var triviaItem = trivia[_i];
                    if (ts.isComment(triviaItem.kind) && ts.rangeContainsRange(originalRange, triviaItem)) {
                        var triviaItemStart = sourceFile.getLineAndCharacterOfPosition(triviaItem.pos);
                        processRange(triviaItem, triviaItemStart, parent, contextNode, dynamicIndentation);
                    }
                }
            }
            function processRange(range, rangeStart, parent, contextNode, dynamicIndentation) {
                var rangeHasError = rangeContainsError(range);
                var lineAdded;
                if (!rangeHasError && !previousRangeHasError) {
                    if (!previousRange) {
                        var originalStart = sourceFile.getLineAndCharacterOfPosition(originalRange.pos);
                        trimTrailingWhitespacesForLines(originalStart.line, rangeStart.line);
                    }
                    else {
                        lineAdded =
                            processPair(range, rangeStart.line, parent, previousRange, previousRangeStartLine, previousParent, contextNode, dynamicIndentation);
                    }
                }
                previousRange = range;
                previousParent = parent;
                previousRangeStartLine = rangeStart.line;
                previousRangeHasError = rangeHasError;
                return lineAdded;
            }
            function processPair(currentItem, currentStartLine, currentParent, previousItem, previousStartLine, previousParent, contextNode, dynamicIndentation) {
                formattingContext.updateContext(previousItem, previousParent, currentItem, currentParent, contextNode);
                var rule = rulesProvider.getRulesMap().GetRule(formattingContext);
                var trimTrailingWhitespaces;
                var lineAdded;
                if (rule) {
                    applyRuleEdits(rule, previousItem, previousStartLine, currentItem, currentStartLine);
                    if (rule.Operation.Action & (2 | 8) && currentStartLine !== previousStartLine) {
                        lineAdded = false;
                        if (currentParent.getStart(sourceFile) === currentItem.pos) {
                            dynamicIndentation.recomputeIndentation(false);
                        }
                    }
                    else if (rule.Operation.Action & 4 && currentStartLine === previousStartLine) {
                        lineAdded = true;
                        if (currentParent.getStart(sourceFile) === currentItem.pos) {
                            dynamicIndentation.recomputeIndentation(true);
                        }
                    }
                    trimTrailingWhitespaces =
                        (rule.Operation.Action & (4 | 2)) &&
                            rule.Flag !== 1;
                }
                else {
                    trimTrailingWhitespaces = true;
                }
                if (currentStartLine !== previousStartLine && trimTrailingWhitespaces) {
                    trimTrailingWhitespacesForLines(previousStartLine, currentStartLine, previousItem);
                }
                return lineAdded;
            }
            function insertIndentation(pos, indentation, lineAdded) {
                var indentationString = getIndentationString(indentation, options);
                if (lineAdded) {
                    recordReplace(pos, 0, indentationString);
                }
                else {
                    var tokenStart = sourceFile.getLineAndCharacterOfPosition(pos);
                    if (indentation !== tokenStart.character) {
                        var startLinePosition = ts.getStartPositionOfLine(tokenStart.line, sourceFile);
                        recordReplace(startLinePosition, tokenStart.character, indentationString);
                    }
                }
            }
            function indentMultilineComment(commentRange, indentation, firstLineIsIndented) {
                var startLine = sourceFile.getLineAndCharacterOfPosition(commentRange.pos).line;
                var endLine = sourceFile.getLineAndCharacterOfPosition(commentRange.end).line;
                var parts;
                if (startLine === endLine) {
                    if (!firstLineIsIndented) {
                        insertIndentation(commentRange.pos, indentation, false);
                    }
                    return;
                }
                else {
                    parts = [];
                    var startPos = commentRange.pos;
                    for (var line = startLine; line < endLine; ++line) {
                        var endOfLine = ts.getEndLinePosition(line, sourceFile);
                        parts.push({ pos: startPos, end: endOfLine });
                        startPos = ts.getStartPositionOfLine(line + 1, sourceFile);
                    }
                    parts.push({ pos: startPos, end: commentRange.end });
                }
                var startLinePos = ts.getStartPositionOfLine(startLine, sourceFile);
                var nonWhitespaceColumnInFirstPart = formatting.SmartIndenter.findFirstNonWhitespaceCharacterAndColumn(startLinePos, parts[0].pos, sourceFile, options);
                if (indentation === nonWhitespaceColumnInFirstPart.column) {
                    return;
                }
                var startIndex = 0;
                if (firstLineIsIndented) {
                    startIndex = 1;
                    startLine++;
                }
                var delta = indentation - nonWhitespaceColumnInFirstPart.column;
                for (var i = startIndex, len = parts.length; i < len; ++i, ++startLine) {
                    var startLinePos_1 = ts.getStartPositionOfLine(startLine, sourceFile);
                    var nonWhitespaceCharacterAndColumn = i === 0
                        ? nonWhitespaceColumnInFirstPart
                        : formatting.SmartIndenter.findFirstNonWhitespaceCharacterAndColumn(parts[i].pos, parts[i].end, sourceFile, options);
                    var newIndentation = nonWhitespaceCharacterAndColumn.column + delta;
                    if (newIndentation > 0) {
                        var indentationString = getIndentationString(newIndentation, options);
                        recordReplace(startLinePos_1, nonWhitespaceCharacterAndColumn.character, indentationString);
                    }
                    else {
                        recordDelete(startLinePos_1, nonWhitespaceCharacterAndColumn.character);
                    }
                }
            }
            function trimTrailingWhitespacesForLines(line1, line2, range) {
                for (var line = line1; line < line2; ++line) {
                    var lineStartPosition = ts.getStartPositionOfLine(line, sourceFile);
                    var lineEndPosition = ts.getEndLinePosition(line, sourceFile);
                    if (range && ts.isComment(range.kind) && range.pos <= lineEndPosition && range.end > lineEndPosition) {
                        continue;
                    }
                    var pos = lineEndPosition;
                    while (pos >= lineStartPosition && ts.isWhiteSpace(sourceFile.text.charCodeAt(pos))) {
                        pos--;
                    }
                    if (pos !== lineEndPosition) {
                        ts.Debug.assert(pos === lineStartPosition || !ts.isWhiteSpace(sourceFile.text.charCodeAt(pos)));
                        recordDelete(pos + 1, lineEndPosition - pos);
                    }
                }
            }
            function newTextChange(start, len, newText) {
                return { span: ts.createTextSpan(start, len), newText: newText };
            }
            function recordDelete(start, len) {
                if (len) {
                    edits.push(newTextChange(start, len, ""));
                }
            }
            function recordReplace(start, len, newText) {
                if (len || newText) {
                    edits.push(newTextChange(start, len, newText));
                }
            }
            function applyRuleEdits(rule, previousRange, previousStartLine, currentRange, currentStartLine) {
                var between;
                switch (rule.Operation.Action) {
                    case 1:
                        return;
                    case 8:
                        if (previousRange.end !== currentRange.pos) {
                            recordDelete(previousRange.end, currentRange.pos - previousRange.end);
                        }
                        break;
                    case 4:
                        if (rule.Flag !== 1 && previousStartLine !== currentStartLine) {
                            return;
                        }
                        var lineDelta = currentStartLine - previousStartLine;
                        if (lineDelta !== 1) {
                            recordReplace(previousRange.end, currentRange.pos - previousRange.end, options.NewLineCharacter);
                        }
                        break;
                    case 2:
                        if (rule.Flag !== 1 && previousStartLine !== currentStartLine) {
                            return;
                        }
                        var posDelta = currentRange.pos - previousRange.end;
                        if (posDelta !== 1 || sourceFile.text.charCodeAt(previousRange.end) !== 32) {
                            recordReplace(previousRange.end, currentRange.pos - previousRange.end, " ");
                        }
                        break;
                }
            }
        }
        function isSomeBlock(kind) {
            switch (kind) {
                case 179:
                case 206:
                    return true;
            }
            return false;
        }
        function getOpenTokenForList(node, list) {
            switch (node.kind) {
                case 135:
                case 200:
                case 162:
                case 134:
                case 133:
                case 163:
                    if (node.typeParameters === list) {
                        return 24;
                    }
                    else if (node.parameters === list) {
                        return 16;
                    }
                    break;
                case 157:
                case 158:
                    if (node.typeArguments === list) {
                        return 24;
                    }
                    else if (node.arguments === list) {
                        return 16;
                    }
                    break;
                case 141:
                    if (node.typeArguments === list) {
                        return 24;
                    }
            }
            return 0;
        }
        function getCloseTokenForOpenToken(kind) {
            switch (kind) {
                case 16:
                    return 17;
                case 24:
                    return 25;
            }
            return 0;
        }
        var internedSizes;
        var internedTabsIndentation;
        var internedSpacesIndentation;
        function getIndentationString(indentation, options) {
            var resetInternedStrings = !internedSizes || (internedSizes.tabSize !== options.TabSize || internedSizes.indentSize !== options.IndentSize);
            if (resetInternedStrings) {
                internedSizes = { tabSize: options.TabSize, indentSize: options.IndentSize };
                internedTabsIndentation = internedSpacesIndentation = undefined;
            }
            if (!options.ConvertTabsToSpaces) {
                var tabs = Math.floor(indentation / options.TabSize);
                var spaces = indentation - tabs * options.TabSize;
                var tabString;
                if (!internedTabsIndentation) {
                    internedTabsIndentation = [];
                }
                if (internedTabsIndentation[tabs] === undefined) {
                    internedTabsIndentation[tabs] = tabString = repeat('\t', tabs);
                }
                else {
                    tabString = internedTabsIndentation[tabs];
                }
                return spaces ? tabString + repeat(" ", spaces) : tabString;
            }
            else {
                var spacesString;
                var quotient = Math.floor(indentation / options.IndentSize);
                var remainder = indentation % options.IndentSize;
                if (!internedSpacesIndentation) {
                    internedSpacesIndentation = [];
                }
                if (internedSpacesIndentation[quotient] === undefined) {
                    spacesString = repeat(" ", options.IndentSize * quotient);
                    internedSpacesIndentation[quotient] = spacesString;
                }
                else {
                    spacesString = internedSpacesIndentation[quotient];
                }
                return remainder ? spacesString + repeat(" ", remainder) : spacesString;
            }
            function repeat(value, count) {
                var s = "";
                for (var i = 0; i < count; ++i) {
                    s += value;
                }
                return s;
            }
        }
        formatting.getIndentationString = getIndentationString;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
