"use strict";
exports.errorsInOpenFiles = { members: [] };
exports.buildOutput = { members: [] };
exports.referencesOutput = { members: [] };
/** This *must* always be set */
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
    list.lastPosition = { filePath, line, col };
}
exports.gotoLine = gotoLine;
/**
 * Uses `activeList` to go to the next error or loop back
 * Storing `lastPosition` with the list allows us to be lazy elsewhere and actively find the element here
 */
function findCurrentIndexInList() {
    // Early exit if no members
    if (!exports.activeList.members.length) {
        atom.notifications.addInfo('AtomTS: no go-to members in active list');
        return -1;
    }
    // If we don't have a lastPosition then first is the last position
    if (!exports.activeList.lastPosition)
        return 0;
    var lastPosition = exports.activeList.lastPosition;
    var index = indexOf(exports.activeList.members, (item) => item.filePath == lastPosition.filePath && item.line == lastPosition.line);
    // if the item has since been removed go to 0
    if (index == -1) {
        return 0;
    }
    return index;
}
/** Uses `activeList` to go to the next position or loop back */
function gotoNext() {
    var currentIndex = findCurrentIndexInList();
    if (currentIndex == -1)
        return;
    var nextIndex = currentIndex + 1;
    // If next is == length then loop to zero
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
    // If next is == -1 then loop to length
    if (previousIndex == -1) {
        previousIndex = exports.activeList.members.length - 1;
    }
    var previous = exports.activeList.members[previousIndex];
    gotoLine(previous.filePath, previous.line, previous.col, exports.activeList);
}
exports.gotoPrevious = gotoPrevious;
/**
 * Utility Return index of element in an array
 */
function indexOf(items, filter) {
    for (var i = 0; i < items.length; i++) {
        if (filter(items[i])) {
            return i;
        }
    }
    return -1;
}
