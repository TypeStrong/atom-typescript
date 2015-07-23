var os_1 = require("os");
var ExtractVariable = (function () {
    function ExtractVariable() {
        this.key = ExtractVariable.name;
    }
    ExtractVariable.prototype.canProvideFix = function (info) {
        return execute(info, function () {
            var identifier = info.positionNode;
            return { display: "Extract variable from " + identifier.text };
        }, function () {
            var identifier = info.positionNode;
            return { display: "Extract variable from " + identifier.text };
        }, function () {
            return { display: "Extract variable" };
        });
        throw "Unexpected state in canProvideFix";
    };
    ExtractVariable.prototype.provideFix = function (info) {
        return execute(info, function () {
            return extractVariableFromCall(info);
        }, function () {
            return extractVariableFromCall(info, "Result");
        }, function (callExpression) {
            return extractVariableFromArg(info, callExpression);
        });
        throw "Unexpected state in provideFix";
    };
    return ExtractVariable;
})();
exports.ExtractVariable = ExtractVariable;
function execute(info, onProperty, onFuncCall, onExtractable) {
    var callExpression = findLowestNode(info.positionNode, ts.SyntaxKind.CallExpression);
    if (callExpression) {
        if (isPropertyCall(info)) {
            return onProperty();
        }
        else if (isFuncCall(info)) {
            return onFuncCall();
        }
        else if (isExtractable(info, callExpression)) {
            return onExtractable(callExpression);
        }
    }
    else if (isPropertyAccess(info)) {
        return onProperty();
    }
}
function extractVariableFromCall(info, postFix) {
    if (postFix === void 0) { postFix = ''; }
    var typeChecker = info.typeChecker;
    var type = getTypeStringForNode(info.positionNode, typeChecker);
    var identifier = info.positionNode;
    return [{
            span: {
                start: startOfLine(info) + indentAtPos(info),
                length: 0
            },
            newText: "var " + identifier.text + postFix + ": " + type + " = ",
            filePath: info.filePath
        }];
}
function extractVariableFromArg(info, callExpression) {
    var argumentIndex = getArgumentIndex(info.positionNode, callExpression);
    var _a = getArgumentDescription(callExpression, argumentIndex, info.typeChecker), name = _a.name, type = _a.type;
    var indent = indentAtPos(info);
    var value = extractValue(info, callExpression);
    return [
        {
            span: {
                start: callExpression.arguments[argumentIndex].getStart(),
                length: value.length
            },
            newText: name,
            filePath: info.filePath
        },
        {
            span: {
                start: startOfLine(info) + indent,
                length: 0
            },
            newText: "var " + name + ": " + type + " = " + value + ";" + os_1.EOL + createIndent(indent),
            filePath: info.filePath
        }];
}
function isPropertyAccess(info) {
    return isValidPath(info.positionNode, [ts.SyntaxKind.Identifier,
        ts.SyntaxKind.PropertyAccessExpression,
        ts.SyntaxKind.ExpressionStatement]);
}
function isFuncCall(info) {
    return isValidPath(info.positionNode, [ts.SyntaxKind.Identifier,
        ts.SyntaxKind.CallExpression,
        ts.SyntaxKind.ExpressionStatement]);
}
function isPropertyCall(info) {
    return isValidPath(info.positionNode, [ts.SyntaxKind.Identifier,
        ts.SyntaxKind.PropertyAccessExpression,
        ts.SyntaxKind.CallExpression,
        ts.SyntaxKind.ExpressionStatement]);
}
function isExtractable(info, callExpression) {
    var argumentIndex = getArgumentIndex(info.positionNode, callExpression);
    return (argumentIndex > -1) &&
        (!((info.positionNode.kind == ts.SyntaxKind.Identifier) &&
            (info.positionNode.parent == callExpression)));
}
function findLowestNode(startNode, kind) {
    var node = startNode;
    var result = new Array();
    while (node) {
        if (node.kind == kind) {
            result.push(node);
        }
        node = node.parent;
    }
    if (result.length == 0) {
        return null;
    }
    else {
        return result.reverse()[0];
    }
}
function getArgumentDescription(node, argumentIndex, typeChecker) {
    var signature = typeChecker.getResolvedSignature(node);
    var argument = signature.parameters[argumentIndex];
    var sigDeclaration = argument.valueDeclaration.type;
    return {
        name: argument.name.trim(),
        type: node.getSourceFile().text.substring(sigDeclaration.pos, sigDeclaration.end).trim()
    };
}
function startOfLine(info) {
    var line = info.project.languageServiceHost.getPositionFromIndex(info.filePath, info.position).line;
    return info.project.languageServiceHost.getIndexFromPosition(info.filePath, { line: line, col: 0 });
}
function indentAtPos(info) {
    return info.service.getIndentationAtPosition(info.filePath, info.positionNode.pos, info.project.projectFile.project.formatCodeOptions);
}
function createIndent(indent) {
    return Array(indent + 1).join(' ');
}
function getTypeStringForNode(node, typeChecker) {
    var type = typeChecker.getTypeAtLocation(node);
    var typeSignature = ts.displayPartsToString(ts.typeToDisplayParts(typeChecker, type)).replace(/\s+/g, ' ');
    var fatArrowPos = typeSignature.indexOf("=>");
    if (fatArrowPos != -1) {
        return typeSignature.substr(fatArrowPos + 3).trim();
    }
    else {
        return typeSignature.trim();
    }
}
function extractValue(info, callExpression) {
    var index = getArgumentIndex(info.positionNode, callExpression);
    var argNode = callExpression.arguments[index];
    return info.positionNode.getSourceFile().text.substr(argNode.pos, argNode.end - argNode.pos).trim();
}
function getArgumentIndex(node, callExpression) {
    for (var i = 0; i < callExpression.arguments.length; i++) {
        var arg = callExpression.arguments[i];
        if ((node.pos >= arg.pos) && (node.end <= arg.end)) {
            return i;
        }
    }
    return -1;
}
function isValidPath(startNode, kinds) {
    var node = startNode;
    for (var i = 0; i < kinds.length; i++) {
        if (!(node.kind == kinds[i])) {
            return false;
        }
        node = node.parent;
        if (!node) {
            return false;
        }
    }
    return true;
}
