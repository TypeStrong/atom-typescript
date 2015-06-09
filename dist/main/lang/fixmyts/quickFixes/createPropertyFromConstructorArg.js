var os_1 = require("os");
var CreatePropertyFromConstructorArg = (function () {
    function CreatePropertyFromConstructorArg() {
        this.key = CreatePropertyFromConstructorArg.name;
    }
    CreatePropertyFromConstructorArg.prototype.canProvideFix = function (info) {
        if (info.positionNode && info.positionNode.parent &&
            info.positionNode.parent.parent && info.positionNode.parent.parent.symbol &&
            info.positionNode.parent.parent.symbol && info.positionNode.parent.parent.symbol.name == '__constructor') {
            if (info.positionNode.parent.kind == 130) {
                return { display: "create read only property for " + info.positionNode.parent.symbol.name };
            }
        }
    };
    CreatePropertyFromConstructorArg.prototype.provideFix = function (info) {
        var classDecl = info.positionNode.parent.parent.parent;
        var constructorDecl = info.positionNode.parent.parent;
        var paramDecl = info.positionNode.parent;
        var symbolName = info.positionNode.parent.symbol.name;
        var typeName = this.getArgumentType(info, paramDecl);
        var firstBrace = classDecl.getChildren().filter(function (x) { return x.kind == 14; })[0];
        var classIndent = info.service.getIndentationAtPosition(info.filePath, firstBrace.end, info.project.projectFile.project.formatCodeOptions);
        var indent = info.project.projectFile.project.formatCodeOptions.IndentSize;
        var indentSetting = {
            classIndent: classIndent,
            indent: indent
        };
        var backingDeclaration = this.createBackingDeclaration(classDecl, symbolName, typeName, indentSetting, info.filePath);
        var assignemnt = this.createAssignment(constructorDecl, symbolName, indentSetting, info.filePath);
        var property = this.createProperty(classDecl, symbolName, typeName, indentSetting, info.filePath);
        return [backingDeclaration, assignemnt, property];
    };
    CreatePropertyFromConstructorArg.prototype.getArgumentType = function (info, paramDecl) {
        if (paramDecl.type) {
            var start = paramDecl.type.pos;
            var end = paramDecl.type.end;
            return info.srcFile.text.substr(start, (end - start)).trim();
        }
        else {
            return 'any';
        }
    };
    CreatePropertyFromConstructorArg.prototype.createBackingDeclaration = function (classDecl, symbolName, typeName, indentSetting, filePath) {
        var indent = this.createIndent(indentSetting, 1);
        var newText = indent + "_" + symbolName + ": " + typeName + ";" + os_1.EOL;
        return {
            span: {
                start: classDecl.nextContainer.pos + 1,
                length: 0
            },
            newText: newText,
            filePath: filePath
        };
    };
    CreatePropertyFromConstructorArg.prototype.createAssignment = function (constructorDecl, symbolName, indentSetting, filePath) {
        var indentLevel2 = this.createIndent(indentSetting, 2);
        var lastBrace = constructorDecl.body.getChildren().filter(function (x) { return x.kind == 15; })[0];
        var newText = "" + os_1.EOL + indentLevel2 + "this._" + symbolName + " = " + symbolName + ";";
        return {
            span: {
                start: lastBrace.end - (6 + indentSetting.classIndent),
                length: 0
            },
            newText: newText,
            filePath: filePath
        };
    };
    CreatePropertyFromConstructorArg.prototype.createProperty = function (classDecl, symbolName, typeName, indentSetting, filePath) {
        var indentLevel1 = this.createIndent(indentSetting, 1);
        var indentLevel2 = this.createIndent(indentSetting, 2);
        var newText = ("" + os_1.EOL + indentLevel1 + "get " + symbolName + "(): " + typeName + " {") +
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
    };
    CreatePropertyFromConstructorArg.prototype.createIndent = function (indentSetting, level) {
        return Array(indentSetting.classIndent + (indentSetting.indent * level) + 1).join(' ');
    };
    return CreatePropertyFromConstructorArg;
})();
exports.CreatePropertyFromConstructorArg = CreatePropertyFromConstructorArg;
