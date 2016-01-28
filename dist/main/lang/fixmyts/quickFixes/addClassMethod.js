"use strict";
var ast = require("../astUtils");
var os_1 = require("os");
function getIdentifierAndClassNames(error) {
    var errorText = error.messageText;
    if (typeof errorText !== 'string') {
        console.error('I have no idea what this is:', errorText);
        return undefined;
    }
    ;
    var match = errorText.match(/Property \'(\w+)\' does not exist on type \'(\w+)\'./);
    if (!match)
        return;
    var identifierName = match[1], className = match[2];
    return { identifierName: identifierName, className: className };
}
function getLastNameAfterDot(text) {
    return text.substr(text.lastIndexOf('.') + 1);
}
function getTypeStringForNode(node, typeChecker) {
    var type = typeChecker.getTypeAtLocation(node);
    return ts.displayPartsToString(ts.typeToDisplayParts(typeChecker, type)).replace(/\s+/g, ' ');
}
var AddClassMethod = (function () {
    function AddClassMethod() {
        this.key = AddClassMethod.name;
    }
    AddClassMethod.prototype.canProvideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == ts.Diagnostics.Property_0_does_not_exist_on_type_1.code; })[0];
        if (!relevantError)
            return;
        if (info.positionNode.kind !== ts.SyntaxKind.Identifier)
            return;
        var match = getIdentifierAndClassNames(relevantError);
        if (!match)
            return;
        var identifierName = match.identifierName, className = match.className;
        return { display: "Add method \"" + identifierName + "\" to current class " + className };
    };
    AddClassMethod.prototype.provideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == ts.Diagnostics.Property_0_does_not_exist_on_type_1.code; })[0];
        var identifier = info.positionNode;
        var identifierName = identifier.text;
        var className = getIdentifierAndClassNames(relevantError).className;
        var typeString = 'any';
        var parentOfParent = identifier.parent.parent;
        if (parentOfParent.kind == ts.SyntaxKind.BinaryExpression
            && parentOfParent.operatorToken.getText().trim() == '=') {
            var binaryExpression = parentOfParent;
            typeString = getTypeStringForNode(binaryExpression.right, info.typeChecker);
        }
        else if (parentOfParent.kind == ts.SyntaxKind.CallExpression) {
            var nativeTypes_1 = ['string', 'number', 'boolean', 'object', 'null', 'undefined', 'RegExp'];
            var abc_1 = 'abcdefghijklmnopqrstuvwxyz';
            var argsAlphabet_1 = abc_1.split('');
            var argsAlphabetPosition_1 = 0;
            var argName_1 = '';
            var argCount_1 = 0;
            var callExp = parentOfParent;
            var typeStringParts = ['('];
            var args_1 = [];
            callExp.arguments.forEach(function (arg) {
                var argType = getTypeStringForNode(arg, info.typeChecker);
                if (nativeTypes_1.indexOf(argType) != -1
                    || argType.indexOf('{') != -1
                    || argType.indexOf('=>') != -1
                    || argType.indexOf('[]') != -1) {
                    var type = info.typeChecker.getTypeAtLocation(arg);
                    var typeName = "type";
                    if (type &&
                        type.symbol &&
                        type.symbol.name) {
                        typeName = type.symbol.name.replace(/[\[\]]/g, '');
                    }
                    ;
                    var hasAnonymous = typeName.indexOf('__') == 0;
                    var isAnonymousTypedArgument = hasAnonymous && typeName.substring(2) == "type";
                    var isAnonymousMethod = hasAnonymous && typeName.substring(2) == "function";
                    var isAnonymousObject = hasAnonymous && typeName.substring(2) == "object";
                    if (argType.indexOf('=>') != -1 &&
                        !isAnonymousTypedArgument &&
                        !isAnonymousMethod &&
                        !isAnonymousObject) {
                        if (typeName == 'Array')
                            typeName = 'array';
                        argName_1 = "" + typeName + argCount_1++;
                    }
                    else if (argType.indexOf('[]') != -1) {
                        argName_1 = "array" + argCount_1++;
                    }
                    else {
                        if (isAnonymousMethod) {
                            typeName = "function";
                            argName_1 = "" + typeName + argCount_1++;
                        }
                        else if (isAnonymousObject) {
                            typeName = "object";
                            argName_1 = "" + typeName + argCount_1++;
                        }
                        else {
                            argName_1 = argsAlphabet_1[argsAlphabetPosition_1];
                            argsAlphabet_1[argsAlphabetPosition_1] += argsAlphabet_1[argsAlphabetPosition_1].substring(1);
                            argsAlphabetPosition_1++;
                            argsAlphabetPosition_1 %= abc_1.length;
                        }
                    }
                }
                else {
                    argName_1 = argType.replace('typeof ', '');
                    if (argType.indexOf('typeof ') == -1) {
                        var firstLower = argName_1[0].toLowerCase();
                        if (argName_1.length == 1) {
                            argName_1 = firstLower;
                        }
                        else {
                            argName_1 = firstLower + argName_1.substring(1);
                        }
                    }
                    argName_1 += argCount_1.toString();
                    argCount_1++;
                }
                if (argType.indexOf('null') != -1 || argType.indexOf('undefined') != -1) {
                    argType = argType.replace(/null|undefined/g, 'any');
                }
                args_1.push(argName_1 + ": " + argType);
            });
            typeStringParts.push(args_1.join(', '));
            typeStringParts.push("): any { }");
            typeString = typeStringParts.join('');
        }
        var memberTarget = ast.getNodeByKindAndName(info.program, ts.SyntaxKind.ClassDeclaration, className);
        if (!memberTarget) {
            memberTarget = ast.getNodeByKindAndName(info.program, ts.SyntaxKind.InterfaceDeclaration, className);
        }
        if (!memberTarget) {
            return [];
        }
        var targetDeclaration = memberTarget;
        var firstBrace = targetDeclaration.getChildren().filter(function (x) { return x.kind == ts.SyntaxKind.OpenBraceToken; })[0];
        var indentLength = info.service.getIndentationAtPosition(memberTarget.getSourceFile().fileName, firstBrace.end, info.project.projectFile.project.formatCodeOptions);
        var indent = Array(indentLength + info.project.projectFile.project.formatCodeOptions.IndentSize + 1).join(' ');
        var refactoring = {
            span: {
                start: firstBrace.end,
                length: 0
            },
            newText: "" + os_1.EOL + indent + "public " + identifierName + typeString,
            filePath: targetDeclaration.getSourceFile().fileName
        };
        return [refactoring];
    };
    return AddClassMethod;
}());
exports.AddClassMethod = AddClassMethod;
