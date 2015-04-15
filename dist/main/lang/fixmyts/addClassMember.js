var ts = require("typescript");
var ast = require("./astUtils");
var AddClassMember = (function () {
    function AddClassMember() {
        this.key = AddClassMember.name;
    }
    AddClassMember.prototype.canProvideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2339; })[0];
        if (!relevantError)
            return;
        if (info.positionNode.kind !== 65)
            return;
        this.provideFix(info);
        return "Add Member to Class";
    };
    AddClassMember.prototype.provideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2339; })[0];
        var errorText = relevantError.messageText;
        if (typeof errorText !== 'string') {
            console.error('I have no idea:', errorText);
            return [];
        }
        ;
        var identifier = info.positionNode;
        var identifierName = identifier.text;
        var typeName = errorText.match(/Property \'(\w+)\' does not exist on type \'(\w+)\'./)[2];
        var classNode = ast.getNodeByKindAndName(info.program, 201, typeName);
        var typeChecker = info.program.getTypeChecker();
        return [];
    };
    return AddClassMember;
})();
exports.default = AddClassMember;
