///<reference path='..\services.ts' />
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var SmartIndenter;
        (function (SmartIndenter) {
            var Value;
            (function (Value) {
                Value[Value["Unknown"] = -1] = "Unknown";
            })(Value || (Value = {}));
            function getIndentation(position, sourceFile, options) {
                if (position > sourceFile.text.length) {
                    return 0;
                }
                var precedingToken = ts.findPrecedingToken(position, sourceFile);
                if (!precedingToken) {
                    return 0;
                }
                var precedingTokenIsLiteral = precedingToken.kind === 8 ||
                    precedingToken.kind === 9 ||
                    precedingToken.kind === 10 ||
                    precedingToken.kind === 11 ||
                    precedingToken.kind === 12 ||
                    precedingToken.kind === 13;
                if (precedingTokenIsLiteral && precedingToken.getStart(sourceFile) <= position && precedingToken.end > position) {
                    return 0;
                }
                var lineAtPosition = sourceFile.getLineAndCharacterOfPosition(position).line;
                if (precedingToken.kind === 23 && precedingToken.parent.kind !== 169) {
                    var actualIndentation = getActualIndentationForListItemBeforeComma(precedingToken, sourceFile, options);
                    if (actualIndentation !== -1) {
                        return actualIndentation;
                    }
                }
                var previous;
                var current = precedingToken;
                var currentStart;
                var indentationDelta;
                while (current) {
                    if (ts.positionBelongsToNode(current, position, sourceFile) && shouldIndentChildNode(current.kind, previous ? previous.kind : 0)) {
                        currentStart = getStartLineAndCharacterForNode(current, sourceFile);
                        if (nextTokenIsCurlyBraceOnSameLineAsCursor(precedingToken, current, lineAtPosition, sourceFile)) {
                            indentationDelta = 0;
                        }
                        else {
                            indentationDelta = lineAtPosition !== currentStart.line ? options.IndentSize : 0;
                        }
                        break;
                    }
                    var actualIndentation = getActualIndentationForListItem(current, sourceFile, options);
                    if (actualIndentation !== -1) {
                        return actualIndentation;
                    }
                    previous = current;
                    current = current.parent;
                }
                if (!current) {
                    return 0;
                }
                return getIndentationForNodeWorker(current, currentStart, undefined, indentationDelta, sourceFile, options);
            }
            SmartIndenter.getIndentation = getIndentation;
            function getIndentationForNode(n, ignoreActualIndentationRange, sourceFile, options) {
                var start = sourceFile.getLineAndCharacterOfPosition(n.getStart(sourceFile));
                return getIndentationForNodeWorker(n, start, ignoreActualIndentationRange, 0, sourceFile, options);
            }
            SmartIndenter.getIndentationForNode = getIndentationForNode;
            function getIndentationForNodeWorker(current, currentStart, ignoreActualIndentationRange, indentationDelta, sourceFile, options) {
                var parent = current.parent;
                var parentStart;
                while (parent) {
                    var useActualIndentation = true;
                    if (ignoreActualIndentationRange) {
                        var start = current.getStart(sourceFile);
                        useActualIndentation = start < ignoreActualIndentationRange.pos || start > ignoreActualIndentationRange.end;
                    }
                    if (useActualIndentation) {
                        var actualIndentation = getActualIndentationForListItem(current, sourceFile, options);
                        if (actualIndentation !== -1) {
                            return actualIndentation + indentationDelta;
                        }
                    }
                    parentStart = getParentStart(parent, current, sourceFile);
                    var parentAndChildShareLine = parentStart.line === currentStart.line ||
                        childStartsOnTheSameLineWithElseInIfStatement(parent, current, currentStart.line, sourceFile);
                    if (useActualIndentation) {
                        var actualIndentation = getActualIndentationForNode(current, parent, currentStart, parentAndChildShareLine, sourceFile, options);
                        if (actualIndentation !== -1) {
                            return actualIndentation + indentationDelta;
                        }
                    }
                    if (shouldIndentChildNode(parent.kind, current.kind) && !parentAndChildShareLine) {
                        indentationDelta += options.IndentSize;
                    }
                    current = parent;
                    currentStart = parentStart;
                    parent = current.parent;
                }
                return indentationDelta;
            }
            function getParentStart(parent, child, sourceFile) {
                var containingList = getContainingList(child, sourceFile);
                if (containingList) {
                    return sourceFile.getLineAndCharacterOfPosition(containingList.pos);
                }
                return sourceFile.getLineAndCharacterOfPosition(parent.getStart(sourceFile));
            }
            function getActualIndentationForListItemBeforeComma(commaToken, sourceFile, options) {
                var commaItemInfo = ts.findListItemInfo(commaToken);
                if (commaItemInfo && commaItemInfo.listItemIndex > 0) {
                    return deriveActualIndentationFromList(commaItemInfo.list.getChildren(), commaItemInfo.listItemIndex - 1, sourceFile, options);
                }
                else {
                    return -1;
                }
            }
            function getActualIndentationForNode(current, parent, currentLineAndChar, parentAndChildShareLine, sourceFile, options) {
                var useActualIndentation = (ts.isDeclaration(current) || ts.isStatement(current)) &&
                    (parent.kind === 227 || !parentAndChildShareLine);
                if (!useActualIndentation) {
                    return -1;
                }
                return findColumnForFirstNonWhitespaceCharacterInLine(currentLineAndChar, sourceFile, options);
            }
            function nextTokenIsCurlyBraceOnSameLineAsCursor(precedingToken, current, lineAtPosition, sourceFile) {
                var nextToken = ts.findNextToken(precedingToken, current);
                if (!nextToken) {
                    return false;
                }
                if (nextToken.kind === 14) {
                    return true;
                }
                else if (nextToken.kind === 15) {
                    var nextTokenStartLine = getStartLineAndCharacterForNode(nextToken, sourceFile).line;
                    return lineAtPosition === nextTokenStartLine;
                }
                return false;
            }
            function getStartLineAndCharacterForNode(n, sourceFile) {
                return sourceFile.getLineAndCharacterOfPosition(n.getStart(sourceFile));
            }
            function childStartsOnTheSameLineWithElseInIfStatement(parent, child, childStartLine, sourceFile) {
                if (parent.kind === 183 && parent.elseStatement === child) {
                    var elseKeyword = ts.findChildOfKind(parent, 76, sourceFile);
                    ts.Debug.assert(elseKeyword !== undefined);
                    var elseKeywordStartLine = getStartLineAndCharacterForNode(elseKeyword, sourceFile).line;
                    return elseKeywordStartLine === childStartLine;
                }
                return false;
            }
            SmartIndenter.childStartsOnTheSameLineWithElseInIfStatement = childStartsOnTheSameLineWithElseInIfStatement;
            function getContainingList(node, sourceFile) {
                if (node.parent) {
                    switch (node.parent.kind) {
                        case 141:
                            if (node.parent.typeArguments &&
                                ts.rangeContainsStartEnd(node.parent.typeArguments, node.getStart(sourceFile), node.getEnd())) {
                                return node.parent.typeArguments;
                            }
                            break;
                        case 154:
                            return node.parent.properties;
                        case 153:
                            return node.parent.elements;
                        case 200:
                        case 162:
                        case 163:
                        case 134:
                        case 133:
                        case 138:
                        case 139: {
                            var start = node.getStart(sourceFile);
                            if (node.parent.typeParameters &&
                                ts.rangeContainsStartEnd(node.parent.typeParameters, start, node.getEnd())) {
                                return node.parent.typeParameters;
                            }
                            if (ts.rangeContainsStartEnd(node.parent.parameters, start, node.getEnd())) {
                                return node.parent.parameters;
                            }
                            break;
                        }
                        case 158:
                        case 157: {
                            var start = node.getStart(sourceFile);
                            if (node.parent.typeArguments &&
                                ts.rangeContainsStartEnd(node.parent.typeArguments, start, node.getEnd())) {
                                return node.parent.typeArguments;
                            }
                            if (node.parent.arguments &&
                                ts.rangeContainsStartEnd(node.parent.arguments, start, node.getEnd())) {
                                return node.parent.arguments;
                            }
                            break;
                        }
                    }
                }
                return undefined;
            }
            function getActualIndentationForListItem(node, sourceFile, options) {
                var containingList = getContainingList(node, sourceFile);
                return containingList ? getActualIndentationFromList(containingList) : -1;
                function getActualIndentationFromList(list) {
                    var index = ts.indexOf(list, node);
                    return index !== -1 ? deriveActualIndentationFromList(list, index, sourceFile, options) : -1;
                }
            }
            function deriveActualIndentationFromList(list, index, sourceFile, options) {
                ts.Debug.assert(index >= 0 && index < list.length);
                var node = list[index];
                var lineAndCharacter = getStartLineAndCharacterForNode(node, sourceFile);
                for (var i = index - 1; i >= 0; --i) {
                    if (list[i].kind === 23) {
                        continue;
                    }
                    var prevEndLine = sourceFile.getLineAndCharacterOfPosition(list[i].end).line;
                    if (prevEndLine !== lineAndCharacter.line) {
                        return findColumnForFirstNonWhitespaceCharacterInLine(lineAndCharacter, sourceFile, options);
                    }
                    lineAndCharacter = getStartLineAndCharacterForNode(list[i], sourceFile);
                }
                return -1;
            }
            function findColumnForFirstNonWhitespaceCharacterInLine(lineAndCharacter, sourceFile, options) {
                var lineStart = sourceFile.getPositionOfLineAndCharacter(lineAndCharacter.line, 0);
                return findFirstNonWhitespaceColumn(lineStart, lineStart + lineAndCharacter.character, sourceFile, options);
            }
            function findFirstNonWhitespaceCharacterAndColumn(startPos, endPos, sourceFile, options) {
                var character = 0;
                var column = 0;
                for (var pos = startPos; pos < endPos; ++pos) {
                    var ch = sourceFile.text.charCodeAt(pos);
                    if (!ts.isWhiteSpace(ch)) {
                        break;
                    }
                    if (ch === 9) {
                        column += options.TabSize + (column % options.TabSize);
                    }
                    else {
                        column++;
                    }
                    character++;
                }
                return { column: column, character: character };
            }
            SmartIndenter.findFirstNonWhitespaceCharacterAndColumn = findFirstNonWhitespaceCharacterAndColumn;
            function findFirstNonWhitespaceColumn(startPos, endPos, sourceFile, options) {
                return findFirstNonWhitespaceCharacterAndColumn(startPos, endPos, sourceFile, options).column;
            }
            SmartIndenter.findFirstNonWhitespaceColumn = findFirstNonWhitespaceColumn;
            function nodeContentIsAlwaysIndented(kind) {
                switch (kind) {
                    case 201:
                    case 202:
                    case 204:
                    case 153:
                    case 179:
                    case 206:
                    case 154:
                    case 145:
                    case 147:
                    case 207:
                    case 221:
                    case 220:
                    case 161:
                    case 157:
                    case 158:
                    case 180:
                    case 198:
                    case 214:
                    case 191:
                    case 170:
                    case 151:
                    case 150:
                        return true;
                }
                return false;
            }
            function shouldIndentChildNode(parent, child) {
                if (nodeContentIsAlwaysIndented(parent)) {
                    return true;
                }
                switch (parent) {
                    case 184:
                    case 185:
                    case 187:
                    case 188:
                    case 186:
                    case 183:
                    case 200:
                    case 162:
                    case 134:
                    case 133:
                    case 138:
                    case 163:
                    case 135:
                    case 136:
                    case 137:
                        return child !== 179;
                    default:
                        return false;
                }
            }
            SmartIndenter.shouldIndentChildNode = shouldIndentChildNode;
        })(SmartIndenter = formatting.SmartIndenter || (formatting.SmartIndenter = {}));
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
