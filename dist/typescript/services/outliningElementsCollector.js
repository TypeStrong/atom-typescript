var ts;
(function (ts) {
    var OutliningElementsCollector;
    (function (OutliningElementsCollector) {
        function collectElements(sourceFile) {
            var elements = [];
            var collapseText = "...";
            function addOutliningSpan(hintSpanNode, startElement, endElement, autoCollapse) {
                if (hintSpanNode && startElement && endElement) {
                    var span = {
                        textSpan: ts.createTextSpanFromBounds(startElement.pos, endElement.end),
                        hintSpan: ts.createTextSpanFromBounds(hintSpanNode.getStart(), hintSpanNode.end),
                        bannerText: collapseText,
                        autoCollapse: autoCollapse
                    };
                    elements.push(span);
                }
            }
            function addOutliningSpanComments(commentSpan, autoCollapse) {
                if (commentSpan) {
                    var span = {
                        textSpan: ts.createTextSpanFromBounds(commentSpan.pos, commentSpan.end),
                        hintSpan: ts.createTextSpanFromBounds(commentSpan.pos, commentSpan.end),
                        bannerText: collapseText,
                        autoCollapse: autoCollapse
                    };
                    elements.push(span);
                }
            }
            function addOutliningForLeadingCommentsForNode(n) {
                var comments = ts.getLeadingCommentRangesOfNode(n, sourceFile);
                if (comments) {
                    var firstSingleLineCommentStart = -1;
                    var lastSingleLineCommentEnd = -1;
                    var isFirstSingleLineComment = true;
                    var singleLineCommentCount = 0;
                    for (var _i = 0; _i < comments.length; _i++) {
                        var currentComment = comments[_i];
                        if (currentComment.kind === 2) {
                            if (isFirstSingleLineComment) {
                                firstSingleLineCommentStart = currentComment.pos;
                            }
                            isFirstSingleLineComment = false;
                            lastSingleLineCommentEnd = currentComment.end;
                            singleLineCommentCount++;
                        }
                        else if (currentComment.kind === 3) {
                            combineAndAddMultipleSingleLineComments(singleLineCommentCount, firstSingleLineCommentStart, lastSingleLineCommentEnd);
                            addOutliningSpanComments(currentComment, false);
                            singleLineCommentCount = 0;
                            lastSingleLineCommentEnd = -1;
                            isFirstSingleLineComment = true;
                        }
                    }
                    combineAndAddMultipleSingleLineComments(singleLineCommentCount, firstSingleLineCommentStart, lastSingleLineCommentEnd);
                }
            }
            function combineAndAddMultipleSingleLineComments(count, start, end) {
                if (count > 1) {
                    var multipleSingleLineComments = {
                        pos: start,
                        end: end,
                        kind: 2
                    };
                    addOutliningSpanComments(multipleSingleLineComments, false);
                }
            }
            function autoCollapse(node) {
                return ts.isFunctionBlock(node) && node.parent.kind !== 163;
            }
            var depth = 0;
            var maxDepth = 20;
            function walk(n) {
                if (depth > maxDepth) {
                    return;
                }
                if (ts.isDeclaration(n)) {
                    addOutliningForLeadingCommentsForNode(n);
                }
                switch (n.kind) {
                    case 179:
                        if (!ts.isFunctionBlock(n)) {
                            var parent_1 = n.parent;
                            var openBrace = ts.findChildOfKind(n, 14, sourceFile);
                            var closeBrace = ts.findChildOfKind(n, 15, sourceFile);
                            if (parent_1.kind === 184 ||
                                parent_1.kind === 187 ||
                                parent_1.kind === 188 ||
                                parent_1.kind === 186 ||
                                parent_1.kind === 183 ||
                                parent_1.kind === 185 ||
                                parent_1.kind === 192 ||
                                parent_1.kind === 223) {
                                addOutliningSpan(parent_1, openBrace, closeBrace, autoCollapse(n));
                                break;
                            }
                            if (parent_1.kind === 196) {
                                var tryStatement = parent_1;
                                if (tryStatement.tryBlock === n) {
                                    addOutliningSpan(parent_1, openBrace, closeBrace, autoCollapse(n));
                                    break;
                                }
                                else if (tryStatement.finallyBlock === n) {
                                    var finallyKeyword = ts.findChildOfKind(tryStatement, 81, sourceFile);
                                    if (finallyKeyword) {
                                        addOutliningSpan(finallyKeyword, openBrace, closeBrace, autoCollapse(n));
                                        break;
                                    }
                                }
                            }
                            var span = ts.createTextSpanFromBounds(n.getStart(), n.end);
                            elements.push({
                                textSpan: span,
                                hintSpan: span,
                                bannerText: collapseText,
                                autoCollapse: autoCollapse(n)
                            });
                            break;
                        }
                    case 206: {
                        var openBrace = ts.findChildOfKind(n, 14, sourceFile);
                        var closeBrace = ts.findChildOfKind(n, 15, sourceFile);
                        addOutliningSpan(n.parent, openBrace, closeBrace, autoCollapse(n));
                        break;
                    }
                    case 201:
                    case 202:
                    case 204:
                    case 154:
                    case 207: {
                        var openBrace = ts.findChildOfKind(n, 14, sourceFile);
                        var closeBrace = ts.findChildOfKind(n, 15, sourceFile);
                        addOutliningSpan(n, openBrace, closeBrace, autoCollapse(n));
                        break;
                    }
                    case 153:
                        var openBracket = ts.findChildOfKind(n, 18, sourceFile);
                        var closeBracket = ts.findChildOfKind(n, 19, sourceFile);
                        addOutliningSpan(n, openBracket, closeBracket, autoCollapse(n));
                        break;
                }
                depth++;
                ts.forEachChild(n, walk);
                depth--;
            }
            walk(sourceFile);
            return elements;
        }
        OutliningElementsCollector.collectElements = collectElements;
    })(OutliningElementsCollector = ts.OutliningElementsCollector || (ts.OutliningElementsCollector = {}));
})(ts || (ts = {}));
