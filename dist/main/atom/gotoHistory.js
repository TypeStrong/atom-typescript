exports.errorsInOpenFiles = { members: [] };
exports.buildOutput = { members: [] };
exports.referencesOutput = { members: [] };
exports.activeList = exports.errorsInOpenFiles;
function gotoLine(filePath, line, col, list) {
    var activeFile, activeEditor = atom.workspace.getActiveTextEditor();
    if (activeEditor !== undefined && activeEditor !== null) {
        activeFile = activeEditor.getPath();
    }
    if (filePath !== activeFile) {
        atom.workspace.open(filePath, {
            initialLine: line - 1,
            initialColumn: col
        });
    }
    else {
        atom.workspace.getActiveTextEditor().cursors[0].setBufferPosition([line - 1, col]);
    }
    list.lastPosition = { filePath: filePath, line: line, col: col };
}
exports.gotoLine = gotoLine;
function findCurrentIndexInList() {
    if (!exports.activeList.members.length) {
        atom.notifications.addInfo('AtomTS: no go-to members in active list');
        return -1;
    }
    if (!exports.activeList.lastPosition)
        return 0;
    var lastPosition = exports.activeList.lastPosition;
    var index = indexOf(exports.activeList.members, function (item) { return item.filePath == lastPosition.filePath && item.line == lastPosition.line; });
    if (index == -1) {
        return 0;
    }
    return index;
}
function gotoNext() {
    var currentIndex = findCurrentIndexInList();
    if (currentIndex == -1)
        return;
    var nextIndex = currentIndex + 1;
    if (nextIndex == exports.activeList.members.length) {
        nextIndex = 0;
    }
    var next = exports.activeList.members[nextIndex];
    gotoLine(next.filePath, next.line, next.col, exports.activeList);
}
exports.gotoNext = gotoNext;
function gotoPrevious() {
    var currentIndex = findCurrentIndexInList();
    if (currentIndex == -1)
        return;
    var previousIndex = currentIndex - 1;
    if (previousIndex == -1) {
        previousIndex = exports.activeList.members.length - 1;
    }
    var previous = exports.activeList.members[previousIndex];
    gotoLine(previous.filePath, previous.line, previous.col, exports.activeList);
}
exports.gotoPrevious = gotoPrevious;
function indexOf(items, filter) {
    for (var i = 0; i < items.length; i++) {
        if (filter(items[i])) {
            return i;
        }
    }
    return -1;
}
