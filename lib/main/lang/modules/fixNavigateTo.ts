import typescript = require('typescript');
let ts:any = typescript;

ts.NavigateTo.getNavigateToItems = function getNavigateToItems(program, cancellationToken, searchValue, maxResultCount) {
    var patternMatcher = ts.createPatternMatcher(searchValue);
    console.error('here');
    var rawItems = [];
    ts.forEach(program.getSourceFiles(), function (sourceFile) {
        cancellationToken.throwIfCancellationRequested();
        var declarations = sourceFile.getNamedDeclarations();
        for (var _i = 0, _n = declarations.length; _i < _n; _i++) {
            var declaration = declarations[_i];
            var name = getDeclarationName(declaration);
            if (name !== undefined) {
                var matches = true; // TODO: patternMatcher.getMatchesForLastSegmentOfPattern(name);
                if (!matches) {
                    continue;
                }
                if (patternMatcher.patternContainsDots) {
                    var containers = getContainers(declaration);
                    if (!containers) {
                        return undefined;
                    }
                    matches = patternMatcher.getMatches(containers, name);
                    if (!matches) {
                        continue;
                    }
                }
                var fileName = sourceFile.fileName;
                var matchKind = bestMatchKind(matches);
                rawItems.push({ name: name, fileName: fileName, matchKind: matchKind, isCaseSensitive: allMatchesAreCaseSensitive(matches), declaration: declaration });
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
        for (var _i = 0, _n = matches.length; _i < _n; _i++) {
            var match = matches[_i];
            if (!match.isCaseSensitive) {
                return false;
            }
        }
        return true;
    }
    function getDeclarationName(declaration) {
        var result = getTextOfIdentifierOrLiteral(declaration.name);
        if (result !== undefined) {
            return result;
        }
        if (declaration.name.kind === 126) {
            var expr = declaration.name.expression;
            if (expr.kind === 153) {
                return expr.name.text;
            }
            return getTextOfIdentifierOrLiteral(expr);
        }
        return undefined;
    }
    function getTextOfIdentifierOrLiteral(node) {
        if (node.kind === 64 ||
            node.kind === 8 ||
            node.kind === 7) {
            return node.text;
        }
        return undefined;
    }
    function tryAddSingleDeclarationName(declaration, containers) {
        if (declaration && declaration.name) {
            var text = getTextOfIdentifierOrLiteral(declaration.name);
            if (text !== undefined) {
                containers.unshift(text);
            }
            else if (declaration.name.kind === 126) {
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
        if (expression.kind === 153) {
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
        if (declaration.name.kind === 126) {
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
        var _bestMatchKind = ts.PatternMatchKind.camelCase;
        for (var _i = 0, _n = matches.length; _i < _n; _i++) {
            var match = matches[_i];
            var kind = match.kind;
            if (kind < _bestMatchKind) {
                _bestMatchKind = kind;
            }
        }
        return _bestMatchKind;
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