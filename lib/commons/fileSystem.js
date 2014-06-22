
(function (FileChangeKind) {
    FileChangeKind[FileChangeKind["ADD"] = 0] = "ADD";

    FileChangeKind[FileChangeKind["UPDATE"] = 1] = "UPDATE";

    FileChangeKind[FileChangeKind["DELETE"] = 2] = "DELETE";

    FileChangeKind[FileChangeKind["RESET"] = 3] = "RESET";
})(exports.FileChangeKind || (exports.FileChangeKind = {}));
var FileChangeKind = exports.FileChangeKind;

