var ts;
(function (ts) {
    var NavigateTo;
    (function (NavigateTo) {
        function getNavigateToItems(program, cancellationToken, searchValue, maxResultCount) {
            var patternMatcher = ts.createPatternMatcher(searchValue);
            var rawItems = [];
            ts.forEach(program.getSourceFiles(), function (sourceFile) {
                cancellationToken.throwIfCancellationRequested();
                var nameToDeclarations = sourceFile.getNamedDeclarations();
                for (var name_1 in nameToDeclarations) {
                    var declarations = ts.getProperty(nameToDeclarations, name_1);
                    if (declarations) {
                        var matches = patternMatcher.getMatchesForLastSegmentOfPattern(name_1);
                        if (!matches) {
                            continue;
                        }
                        for (var _i = 0; _i < declarations.length; _i++) {
                            var declaration = declarations[_i];
                            if (patternMatcher.patternContainsDots) {
                                var containers = getContainers(declaration);
                                if (!containers) {
                                    return undefined;
                                }
                                matches = patternMatcher.getMatches(containers, name_1);
                                if (!matches) {
                                    continue;
                                }
                            }
                            var fileName = sourceFile.fileName;
                            var matchKind = bestMatchKind(matches);
                            rawItems.push({ name: name_1, fileName: fileName, matchKind: matchKind, isCaseSensitive: allMatchesAreCaseSensitive(matches), declaration: declaration });
                        }
                    }
                }
            });
            rawItems.sort(compareNavigateToItems);
            if (maxResultCount !== undefined) {
                rawItems = rawItems.slice(0, maxResultCount);
            }
            var items = ts.map(rawItems, createNavigateToItem);
            return items;
            function allMatchesAreCaseSensitive(matches) {
                ts.Debug.assert(matches.length > 0);
                for (var _i = 0; _i < matches.length; _i++) {
                    var match = matches[_i];
                    if (!match.isCaseSensitive) {
                        return false;
                    }
                }
                return true;
            }
            function getTextOfIdentifierOrLiteral(node) {
                if (node) {
                    if (node.kind === 65 ||
                        node.kind === 8 ||
                        node.kind === 7) {
                        return node.text;
                    }
                }
                return undefined;
            }
            function tryAddSingleDeclarationName(declaration, containers) {
                if (declaration && declaration.name) {
                    var text = getTextOfIdentifierOrLiteral(declaration.name);
                    if (text !== undefined) {
                        containers.unshift(text);
                    }
                    else if (declaration.name.kind === 127) {
                        return tryAddComputedPropertyName(declaration.name.expression, containers, true);
                    }
                    else {
                        return false;
                    }
                }
                return true;
            }
            function tryAddComputedPropertyName(expression, containers, includeLastPortion) {
                var text = getTextOfIdentifierOrLiteral(expression);
                if (text !== undefined) {
                    if (includeLastPortion) {
                        containers.unshift(text);
                    }
                    return true;
                }
                if (expression.kind === 155) {
                    var propertyAccess = expression;
                    if (includeLastPortion) {
                        containers.unshift(propertyAccess.name.text);
                    }
                    return tryAddComputedPropertyName(propertyAccess.expression, containers, true);
                }
                return false;
            }
            function getContainers(declaration) {
                var containers = [];
                if (declaration.name.kind === 127) {
                    if (!tryAddComputedPropertyName(declaration.name.expression, containers, false)) {
                        return undefined;
                    }
                }
                declaration = ts.getContainerNode(declaration);
                while (declaration) {
                    if (!tryAddSingleDeclarationName(declaration, containers)) {
                        return undefined;
                    }
                    declaration = ts.getContainerNode(declaration);
                }
                return containers;
            }
            function bestMatchKind(matches) {
                ts.Debug.assert(matches.length > 0);
                var bestMatchKind = ts.PatternMatchKind.camelCase;
                for (var _i = 0; _i < matches.length; _i++) {
                    var match = matches[_i];
                    var kind = match.kind;
                    if (kind < bestMatchKind) {
                        bestMatchKind = kind;
                    }
                }
                return bestMatchKind;
            }
            var baseSensitivity = { sensitivity: "base" };
            function compareNavigateToItems(i1, i2) {
                return i1.matchKind - i2.matchKind ||
                    i1.name.localeCompare(i2.name, undefined, baseSensitivity) ||
                    i1.name.localeCompare(i2.name);
            }
            function createNavigateToItem(rawItem) {
                var declaration = rawItem.declaration;
                var container = ts.getContainerNode(declaration);
                return {
                    name: rawItem.name,
                    kind: ts.getNodeKind(declaration),
                    kindModifiers: ts.getNodeModifiers(declaration),
                    matchKind: ts.PatternMatchKind[rawItem.matchKind],
                    isCaseSensitive: rawItem.isCaseSensitive,
                    fileName: rawItem.fileName,
                    textSpan: ts.createTextSpanFromBounds(declaration.getStart(), declaration.getEnd()),
                    containerName: container && container.name ? container.name.text : "",
                    containerKind: container && container.name ? ts.getNodeKind(container) : ""
                };
            }
        }
        NavigateTo.getNavigateToItems = getNavigateToItems;
    })(NavigateTo = ts.NavigateTo || (ts.NavigateTo = {}));
})(ts || (ts = {}));
