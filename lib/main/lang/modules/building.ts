import project = require('../core/project');
import mkdirp = require('mkdirp');
import path = require('path');
import fs = require('fs');
import {pathIsRelative, makeRelativePath} from "../../tsconfig/tsconfig";
import {consistentPath} from "../../utils/fsUtil";
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
