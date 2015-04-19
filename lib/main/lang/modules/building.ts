import ts = require('typescript');
import project = require('../core/project');
import mkdirp = require('mkdirp');
import path = require('path');
import fs = require('fs');
import {pathIsRelative, consistentPath, makeRelativePath} from "../../tsconfig/tsconfig";
import {createMap} from "../utils";


export function diagnosticToTSError(diagnostic: ts.Diagnostic): TSError {
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
export function emitFile(proj: project.Project, filePath: string): EmitOutput {
    var services = proj.languageService;
    var output = services.getEmitOutput(filePath);
    var emitDone = !output.emitSkipped;
    var errors: TSError[] = [];

    // Emit is no guarantee that there are no errors
    var allDiagnostics = services.getCompilerOptionsDiagnostics()
        .concat(services.getSyntacticDiagnostics(filePath))
        .concat(services.getSemanticDiagnostics(filePath));

    allDiagnostics.forEach(diagnostic => {
        // happens only for 'lib.d.ts' for some reason
        if (!diagnostic.file) return;

        var startPosition = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        errors.push(diagnosticToTSError(diagnostic));
    });

    output.outputFiles.forEach(o => {
        mkdirp.sync(path.dirname(o.name));
        fs.writeFileSync(o.name, o.text, "utf8");
    });

    var outputFiles = output.outputFiles.map((o) => o.name);
    if (path.extname(filePath) == '.d.ts') {
        outputFiles.push(filePath);
    }

    return {
        outputFiles: outputFiles,
        success: emitDone && !errors.length,
        errors: errors,
        emitError: !emitDone
    };
}
export function getRawOutput(proj: project.Project, filePath: string): ts.EmitOutput {
    var services = proj.languageService;
    var output = services.getEmitOutput(filePath);
    return output;
}

import dts = require("../../tsconfig/dts-generator");

export function emitDts(proj: project.Project) {

    if (!proj.projectFile.project) return;
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
    var externs = proj.projectFile.project.files.filter(x=> path.basename(path.dirname(x)) == 'typings' // e.g tsd.d.ts
        || path.basename(path.dirname(path.dirname(x))) == 'typings');

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
