var os_1 = require("os");
var WrapInProperty = (function () {
    function WrapInProperty() {
        this.key = WrapInProperty.name;
    }
    WrapInProperty.prototype.canProvideFix = function (info) {
        if (info.positionNode && info.positionNode.parent &&
            info.positionNode.parent.parent && info.positionNode.parent.parent.symbol &&
            info.positionNode.parent.parent.symbol && info.positionNode.parent.parent.symbol.name == '__constructor') {
            if (info.positionNode.parent.kind == ts.SyntaxKind.Parameter) {
                return { display: "Wrap " + info.positionNode.parent.symbol.name + " in a read only property" };
            }
        }
    };
    WrapInProperty.prototype.provideFix = function (info) {
        var classDecl = info.positionNode.parent.parent.parent;
        var constructorDecl = info.positionNode.parent.parent;
        var paramDecl = info.positionNode.parent;
        var symbolName = info.positionNode.parent.symbol.name;
        var typeName = getArgumentType(info, paramDecl);
        var firstBrace = classDecl.getChildren().filter(function (x) { return x.kind == ts.SyntaxKind.OpenBraceToken; })[0];
        var classIndent = info.service.getIndentationAtPosition(info.filePath, firstBrace.end, info.project.projectFile.project.formatCodeOptions);
        var indent = info.project.projectFile.project.formatCodeOptions.IndentSize;
        var indentSetting = {
            classIndent: classIndent,
            indent: indent
        };
        var assignemnt = createAssignment(constructorDecl, symbolName, indentSetting, info.filePath);
        var property = createProperty(classDecl, symbolName, typeName, indentSetting, info.filePath);
        return [assignemnt, property];
    };
    return WrapInProperty;
})();
exports.WrapInProperty = WrapInProperty;
function createAssignment(constructorDecl, symbolName, indentSetting, filePath) {
    var indentLevel2 = createIndent(indentSetting, 2);
    var lastBrace = constructorDecl.body.getChildren()
        .filter(function (x) { return x.kind == ts.SyntaxKind.CloseBraceToken; }).reverse()[0];
    var newText = "" + os_1.EOL + indentLevel2 + "this._" + symbolName + " = " + symbolName + ";";
    return {
        span: {
            start: lastBrace.end - (6 + indentSetting.classIndent),
            length: 0
        },
        newText: newText,
        filePath: filePath
    };
}
function createProperty(classDecl, symbolName, typeName, indentSetting, filePath) {
    var indentLevel1 = createIndent(indentSetting, 1);
    var indentLevel2 = createIndent(indentSetting, 2);
    var newText = ("" + os_1.EOL + indentLevel1 + "_" + symbolName + ": " + typeName + ";") +
        ("" + os_1.EOL + indentLevel1 + "get " + symbolName + "(): " + typeName + " {") +
        ("" + os_1.EOL + indentLevel2 + "return this._" + symbolName + ";") +
        ("" + os_1.EOL + indentLevel1 + "}");
    return {
        span: {
            start: classDecl.end - (2 + indentSetting.classIndent),
            length: 0
        },
        newText: newText,
        filePath: filePath
    };
}
function createIndent(indentSetting, level) {
    return Array(indentSetting.classIndent + (indentSetting.indent * level) + 1).join(' ');
}
function getArgumentType(info, paramDecl) {
    if (paramDecl.type) {
        var start = paramDecl.type.pos;
        var end = paramDecl.type.end;
        return info.sourceFile.text.substr(start, (end - start)).trim();
    }
    else {
        return 'any';
    }
}
