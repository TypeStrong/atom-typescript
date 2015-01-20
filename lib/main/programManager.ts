///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import tsconfig = require('tsconfig');

export class Program {
}

var programs: { [projectDir: string]: Program } = {}

export function getOrCreateAProgram(filePath) {
    try {
        var project = tsconfig.getProjectSync(filePath);
        console.log('project found:', project);
        // TODO: Create a program for project
    } catch (ex) {
        // TODO: Create a single file program
        console.log('no project found');
    }

}
