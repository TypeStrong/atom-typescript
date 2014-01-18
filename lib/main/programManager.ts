///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import tsproj = require('tsproj');

class ProgramManager {
}

var programs: { [projectDir: string]: ProgramManager } = {}

function getOrCreateAProgramManager(filePath) {
    try {
        var projects = tsproj.getProjectsForFileSync(filePath);
        // TODO: Create a program for project 
    } catch (ex) {
        // TODO: Create a single file program
    }

}

export = getOrCreateAProgramManager;