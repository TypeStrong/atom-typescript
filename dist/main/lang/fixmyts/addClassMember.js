var AddClassMember = (function () {
    function AddClassMember() {
        this.key = AddClassMember.name;
    }
    AddClassMember.prototype.canProvideFix = function (info) {
        var relevantError = info.positionErrors.filter(function (x) { return x.code == 2339; });
        if (relevantError.length) {
            return "Add Member to Class";
        }
        return '';
    };
    AddClassMember.prototype.provideFix = function (info) {
        return [];
    };
    return AddClassMember;
})();
exports.default = AddClassMember;
