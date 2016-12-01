import project = require('../core/project');
import mkdirp = require('mkdirp');
import path = require('path');
import fs = require('fs');
import {pathIsRelative, makeRelativePath} from "../../tsconfig/tsconfig";
import {consistentPath} from "../../utils/fsUtil";
import {createMap, assign} from "../utils";
var findup = require('findup');

/** If we get a compile request for a ts file that is not in project. We return a js file with the following content */
export const Not_In_Context = "/* NotInContext */";

export function diagnosticToTSError(diagnostic: ts.Diagnostic): CodeError {
    var filePath = diagnostic.file.fileName;
    var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    var endPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start + diagnostic.length);

    return {
        filePath: filePath,
        startPos: { line: startPosition.line, col: startPosition.character },
        endPos: { line: endPosition.line, col: endPosition.character },
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        preview: diagnostic.file.text.substr(diagnostic.start, diagnostic.length),
    };
}

export function getRawOutput(proj: project.Project, filePath: string): ts.EmitOutput {
    let services = proj.languageService;
    let output: ts.EmitOutput;
    if (proj.includesSourceFile(filePath)) {
        output = services.getEmitOutput(filePath);
    } else {
        output = {
            outputFiles: [{ name: filePath, text: Not_In_Context, writeByteOrderMark: false }],
            emitSkipped: true
        }
    }
    return output;
}

function isJSFile(fileName: string) {
    return (path.extname(fileName).toLocaleLowerCase() === ".js");
}

function isJSSourceMapFile(fileName: string) {
    let lastExt = path.extname(fileName);
    if (lastExt === ".map") {
        return isJSFile(fileName.substr(0, fileName.length - 4));
    }
    return false;
}


import dts = require("../../tsconfig/dts-generator");

export function emitDts(proj: project.Project) {

    if (!proj.projectFile.project) return;
    if (proj.projectFile.project.compilerOptions.outFile) return;
    if (!proj.projectFile.project.package) return;
    if (!proj.projectFile.project.package.directory) return;
    if (!proj.projectFile.project.package.definition) return;

    // Determined from package.json typescript.definition property
    var outFile = path.resolve(proj.projectFile.project.package.directory, './', proj.projectFile.project.package.definition)

    // This is package.json directory
    var baseDir = proj.projectFile.project.package.directory;

    // The name of the package (of course!)
    var name = proj.projectFile.project.package.name;

    // The main file
    var main: string = proj.projectFile.project.package.main;

    // We need to find a ts file for this `main` and we also need to get its
    if (main) {
        // if path is relative we need to replace that section with 'name'
        // ./foo => 'something/foo'
        main = name + '/' + consistentPath(main.replace('./', ''));

        // Replace trailing `.js` with nothing
        main = main.replace(/\.*.js$/g, '');
    }

    // Typings become externs
    // And these are relative to the output .d.ts we are generating
    var externs = proj.projectFile.project.typings;

    // The files
    var files = proj.projectFile.project.files;

    dts.generate({
        baseDir,
        files,
        externs,
        name: name,

        target: proj.projectFile.project.compilerOptions.target,
        out: outFile,

        main: main,

        outDir: proj.projectFile.project.compilerOptions.outDir
    })
}
