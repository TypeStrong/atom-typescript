"use strict";
var fsu = require("../utils/fsUtil");
var simpleValidator = require('./simpleValidator');
var types = simpleValidator.types;
var compilerOptionsValidation = {
    allowJs: { type: types.boolean },
    allowNonTsExtensions: { type: types.boolean },
    allowSyntheticDefaultImports: { type: types.boolean },
    allowUnreachableCode: { type: types.boolean },
    allowUnusedLabels: { type: types.boolean },
    charset: { type: types.string },
    codepage: { type: types.number },
    declaration: { type: types.boolean },
    diagnostics: { type: types.boolean },
    emitBOM: { type: types.boolean },
    experimentalAsyncFunctions: { type: types.boolean },
    experimentalDecorators: { type: types.boolean },
    emitDecoratorMetadata: { type: types.boolean },
    help: { type: types.boolean },
    inlineSourceMap: { type: types.boolean },
    inlineSources: { type: types.boolean },
    isolatedModules: { type: types.boolean },
    jsx: { type: types.string, validValues: ['preserve', 'react'] },
    locals: { type: types.string },
    listFiles: { type: types.boolean },
    mapRoot: { type: types.string },
    module: { type: types.string, validValues: ['commonjs', 'amd', 'system', 'umd', 'es6', 'es2015'] },
    moduleResolution: { type: types.string, validValues: ['classic', 'node'] },
    newLine: { type: types.string },
    noEmit: { type: types.boolean },
    noEmitHelpers: { type: types.boolean },
    noEmitOnError: { type: types.boolean },
    noErrorTruncation: { type: types.boolean },
    noFallthroughCasesInSwitch: { type: types.boolean },
    noImplicitAny: { type: types.boolean },
    noImplicitUseStrict: { type: types.boolean },
    noImplicitReturns: { type: types.boolean },
    noLib: { type: types.boolean },
    noLibCheck: { type: types.boolean },
    noResolve: { type: types.boolean },
    out: { type: types.string },
    outFile: { type: types.string },
    outDir: { type: types.string },
    preserveConstEnums: { type: types.boolean },
    removeComments: { type: types.boolean },
    rootDir: { type: types.string },
    skipDefaultLibCheck: { type: types.boolean },
    sourceMap: { type: types.boolean },
    sourceRoot: { type: types.string },
    stripInternal: { type: types.boolean },
    suppressExcessPropertyErrors: { type: types.boolean },
    suppressImplicitAnyIndexErrors: { type: types.boolean },
    target: { type: types.string, validValues: ['es3', 'es5', 'es6', 'es2015'] },
    version: { type: types.boolean },
    watch: { type: types.boolean },
};
var validator = new simpleValidator.SimpleValidator(compilerOptionsValidation);
exports.errors = {
    GET_PROJECT_INVALID_PATH: 'The path used to query for tsconfig.json does not exist',
    GET_PROJECT_NO_PROJECT_FOUND: 'No Project Found',
    GET_PROJECT_FAILED_TO_OPEN_PROJECT_FILE: 'Failed to fs.readFileSync the project file',
    GET_PROJECT_JSON_PARSE_FAILED: 'Failed to JSON.parse the project file',
    GET_PROJECT_GLOB_EXPAND_FAILED: 'Failed to expand filesGlob in the project file',
    GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS: 'Project file contains invalid options',
    CREATE_FILE_MUST_EXIST: 'The Typescript file must exist on disk in order to create a project',
    CREATE_PROJECT_ALREADY_EXISTS: 'Project file already exists',
};
function errorWithDetails(error, details) {
    error.details = details;
    return error;
}
var fs = require('fs');
var path = require('path');
var tsconfig = require('tsconfig');
var os = require('os');
var detectIndent = require('detect-indent');
var detectNewline = require('detect-newline');
var formatting = require('./formatting');
var projectFileName = 'tsconfig.json';
var defaultFilesGlob = [
    "**/*.ts",
    "**/*.tsx",
    "!node_modules/**",
];
var invisibleFilesGlob = '{**/*.ts,**/*.tsx}';
exports.defaults = {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    isolatedModules: false,
    jsx: ts.JsxEmit.React,
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    declaration: false,
    noImplicitAny: false,
    noImplicitUseStrict: false,
    removeComments: true,
    noLib: false,
    preserveConstEnums: true,
    suppressImplicitAnyIndexErrors: true
};
var typescriptEnumMap = {
    target: {
        'es3': ts.ScriptTarget.ES3,
        'es5': ts.ScriptTarget.ES5,
        'es6': ts.ScriptTarget.ES6,
        'latest': ts.ScriptTarget.Latest
    },
    module: {
        'none': ts.ModuleKind.None,
        'commonjs': ts.ModuleKind.CommonJS,
        'amd': ts.ModuleKind.AMD,
        'umd': ts.ModuleKind.UMD,
        'system': ts.ModuleKind.System,
        'es6': ts.ModuleKind.ES6,
        'es2015': ts.ModuleKind.ES2015,
    },
    moduleResolution: {
        'node': ts.ModuleResolutionKind.NodeJs,
        'classic': ts.ModuleResolutionKind.Classic
    },
    jsx: {
        'preserve': ts.JsxEmit.Preserve,
        'react': ts.JsxEmit.React
    },
    newLine: {
        'CRLF': ts.NewLineKind.CarriageReturnLineFeed,
        'LF': ts.NewLineKind.LineFeed
    }
};
var jsonEnumMap = {};
Object.keys(typescriptEnumMap).forEach(function (name) {
    jsonEnumMap[name] = reverseKeysAndValues(typescriptEnumMap[name]);
});
function mixin(target, source) {
    for (var key in source) {
        target[key] = source[key];
    }
    return target;
}
function rawToTsCompilerOptions(jsonOptions, projectDir) {
    var compilerOptions = mixin({}, exports.defaults);
    for (var key in jsonOptions) {
        if (typescriptEnumMap[key]) {
            var name_1 = jsonOptions[key];
            var map = typescriptEnumMap[key];
            compilerOptions[key] = map[name_1.toLowerCase()] || map[name_1.toUpperCase()];
        }
        else {
            compilerOptions[key] = jsonOptions[key];
        }
    }
    if (compilerOptions.outDir !== undefined) {
        compilerOptions.outDir = path.resolve(projectDir, compilerOptions.outDir);
    }
    if (compilerOptions.rootDir !== undefined) {
        compilerOptions.rootDir = path.resolve(projectDir, compilerOptions.rootDir);
    }
    if (compilerOptions.out !== undefined) {
        compilerOptions.outFile = path.resolve(projectDir, compilerOptions.out);
    }
    if (compilerOptions.outFile !== undefined) {
        compilerOptions.outFile = path.resolve(projectDir, compilerOptions.outFile);
    }
    return compilerOptions;
}
function tsToRawCompilerOptions(compilerOptions) {
    var jsonOptions = mixin({}, compilerOptions);
    Object.keys(compilerOptions).forEach(function (key) {
        if (jsonEnumMap[key] && compilerOptions[key]) {
            var value = compilerOptions[key];
            jsonOptions[key] = jsonEnumMap[key][value];
        }
    });
    return jsonOptions;
}
function getDefaultInMemoryProject(srcFile) {
    var dir = fs.lstatSync(srcFile).isDirectory() ? srcFile : path.dirname(srcFile);
    var files = [srcFile];
    var typings = getDefinitionsForNodeModules(dir, files);
    files = increaseProjectForReferenceAndImports(files);
    files = uniq(files.map(fsu.consistentPath));
    var project = {
        compilerOptions: exports.defaults,
        files: files,
        typings: typings.ours.concat(typings.implicit),
        formatCodeOptions: formatting.defaultFormatCodeOptions(),
        compileOnSave: true,
        buildOnSave: false,
        scripts: {},
        atom: { rewriteTsconfig: true, formatOnSave: false },
    };
    return {
        projectFileDirectory: dir,
        projectFilePath: dir + '/' + projectFileName,
        project: project,
        inMemory: true
    };
}
exports.getDefaultInMemoryProject = getDefaultInMemoryProject;
function getProjectSync(pathOrSrcFile) {
    if (!fs.existsSync(pathOrSrcFile)) {
        throw new Error(exports.errors.GET_PROJECT_INVALID_PATH);
    }
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);
    var projectFile = tsconfig.resolveSync(dir);
    if (!projectFile) {
        throw errorWithDetails(new Error(exports.errors.GET_PROJECT_NO_PROJECT_FOUND), { projectFilePath: fsu.consistentPath(pathOrSrcFile), errorMessage: 'not found' });
    }
    var projectFileDirectory = path.dirname(projectFile) + path.sep;
    var projectSpec;
    var projectFileTextContent;
    try {
        projectFileTextContent = fs.readFileSync(projectFile, 'utf8');
    }
    catch (ex) {
        throw new Error(exports.errors.GET_PROJECT_FAILED_TO_OPEN_PROJECT_FILE);
    }
    try {
        projectSpec = tsconfig.parseFileSync(projectFileTextContent, projectFile, { resolvePaths: false });
    }
    catch (ex) {
        throw errorWithDetails(new Error(exports.errors.GET_PROJECT_JSON_PARSE_FAILED), { projectFilePath: fsu.consistentPath(projectFile), error: ex.message });
    }
    if (!projectSpec.atom) {
        projectSpec.atom = {
            rewriteTsconfig: true,
        };
    }
    if (projectSpec.filesGlob) {
        var prettyJSONProjectSpec = prettyJSON(projectSpec, detectIndent(projectFileTextContent).indent, detectNewline(projectFileTextContent));
        if (prettyJSONProjectSpec !== projectFileTextContent && projectSpec.atom.rewriteTsconfig) {
            fs.writeFileSync(projectFile, prettyJSONProjectSpec);
        }
    }
    var pkg = null;
    try {
        var packagePath = travelUpTheDirectoryTreeTillYouFind(projectFileDirectory, 'package.json');
        if (packagePath) {
            var packageJSONPath = getPotentiallyRelativeFile(projectFileDirectory, packagePath);
            var parsedPackage = JSON.parse(fs.readFileSync(packageJSONPath).toString());
            pkg = {
                main: parsedPackage.main,
                name: parsedPackage.name,
                directory: path.dirname(packageJSONPath),
                definition: parsedPackage.typescript && parsedPackage.typescript.definition
            };
        }
    }
    catch (ex) {
    }
    var project = {
        compilerOptions: {},
        files: projectSpec.files.map(function (x) { return path.resolve(projectFileDirectory, x); }),
        filesGlob: projectSpec.filesGlob,
        formatCodeOptions: formatting.makeFormatCodeOptions(projectSpec.formatCodeOptions),
        compileOnSave: projectSpec.compileOnSave == undefined ? true : projectSpec.compileOnSave,
        package: pkg,
        typings: [],
        externalTranspiler: projectSpec.externalTranspiler == undefined ? undefined : projectSpec.externalTranspiler,
        scripts: projectSpec.scripts || {},
        buildOnSave: !!projectSpec.buildOnSave,
        atom: { rewriteTsconfig: true, formatOnSave: !!projectSpec.atom.formatOnSave }
    };
    var validationResult = validator.validate(projectSpec.compilerOptions);
    if (validationResult.errorMessage) {
        throw errorWithDetails(new Error(exports.errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS), { projectFilePath: fsu.consistentPath(projectFile), errorMessage: validationResult.errorMessage });
    }
    project.compilerOptions = rawToTsCompilerOptions(projectSpec.compilerOptions, projectFileDirectory);
    project.files = increaseProjectForReferenceAndImports(project.files);
    var typings = getDefinitionsForNodeModules(dir, project.files);
    project.files = project.files.concat(typings.implicit);
    project.typings = typings.ours.concat(typings.implicit);
    project.files = project.files.concat(typings.packagejson);
    project.files = uniq(project.files.map(fsu.consistentPath));
    projectFileDirectory = removeTrailingSlash(fsu.consistentPath(projectFileDirectory));
    return {
        projectFileDirectory: projectFileDirectory,
        projectFilePath: projectFileDirectory + '/' + projectFileName,
        project: project,
        inMemory: false
    };
}
exports.getProjectSync = getProjectSync;
function createProjectRootSync(srcFile, defaultOptions) {
    if (!fs.existsSync(srcFile)) {
        throw new Error(exports.errors.CREATE_FILE_MUST_EXIST);
    }
    var dir = fs.lstatSync(srcFile).isDirectory() ? srcFile : path.dirname(srcFile);
    var projectFilePath = path.normalize(dir + '/' + projectFileName);
    if (fs.existsSync(projectFilePath))
        throw new Error(exports.errors.CREATE_PROJECT_ALREADY_EXISTS);
    var projectSpec = {};
    projectSpec.compilerOptions = tsToRawCompilerOptions(defaultOptions || exports.defaults);
    projectSpec.exclude = ["node_modules", "typings/browser", "typings/browser.d.ts"];
    projectSpec.compileOnSave = true;
    projectSpec.buildOnSave = false;
    projectSpec.atom = {
        rewriteTsconfig: false
    };
    fs.writeFileSync(projectFilePath, prettyJSON(projectSpec));
    return getProjectSync(srcFile);
}
exports.createProjectRootSync = createProjectRootSync;
function increaseProjectForReferenceAndImports(files) {
    var filesMap = simpleValidator.createMap(files);
    var willNeedMoreAnalysis = function (file) {
        if (!filesMap[file]) {
            filesMap[file] = true;
            files.push(file);
            return true;
        }
        else {
            return false;
        }
    };
    var getReferencedOrImportedFiles = function (files) {
        var referenced = [];
        files.forEach(function (file) {
            try {
                var content = fs.readFileSync(file).toString();
            }
            catch (ex) {
                return;
            }
            var preProcessedFileInfo = ts.preProcessFile(content, true), dir = path.dirname(file);
            var extensions = ['.ts', '.d.ts', '.tsx'];
            function getIfExists(filePathNoExt) {
                for (var _i = 0, extensions_1 = extensions; _i < extensions_1.length; _i++) {
                    var ext = extensions_1[_i];
                    if (fs.existsSync(filePathNoExt + ext)) {
                        return filePathNoExt + ext;
                    }
                }
            }
            referenced.push(preProcessedFileInfo.referencedFiles.map(function (fileReference) {
                var file = path.resolve(dir, fsu.consistentPath(fileReference.fileName));
                if (fs.existsSync(file)) {
                    return file;
                }
                return getIfExists(file);
            }).filter(function (file) { return !!file; })
                .concat(preProcessedFileInfo.importedFiles
                .filter(function (fileReference) { return pathIsRelative(fileReference.fileName); })
                .map(function (fileReference) {
                var fileNoExt = path.resolve(dir, fileReference.fileName);
                var file = getIfExists(fileNoExt);
                if (!file) {
                    file = getIfExists(file + "/index");
                }
                return file;
            }).filter(function (file) { return !!file; })));
        });
        return selectMany(referenced);
    };
    var more = getReferencedOrImportedFiles(files)
        .filter(willNeedMoreAnalysis);
    while (more.length) {
        more = getReferencedOrImportedFiles(files)
            .filter(willNeedMoreAnalysis);
    }
    return files;
}
function getDefinitionsForNodeModules(projectDir, files) {
    var packagejson = [];
    function versionStringToNumber(version) {
        var _a = version.split('.'), maj = _a[0], min = _a[1], patch = _a[2];
        return parseInt(maj) * 1000000 + parseInt(min);
    }
    var typings = {};
    var ourTypings = files
        .filter(function (f) { return path.basename(path.dirname(f)) == 'typings' && endsWith(f, '.d.ts')
        || path.basename(path.dirname(path.dirname(f))) == 'typings' && endsWith(f, '.d.ts'); });
    ourTypings.forEach(function (f) { return typings[path.basename(f)] = { filePath: f, version: Infinity }; });
    var existing = createMap(files.map(fsu.consistentPath));
    function addAllReferencedFilesWithMaxVersion(file) {
        var dir = path.dirname(file);
        try {
            var content = fs.readFileSync(file).toString();
        }
        catch (ex) {
            return;
        }
        var preProcessedFileInfo = ts.preProcessFile(content, true);
        var files = preProcessedFileInfo.referencedFiles.map(function (fileReference) {
            var file = path.resolve(dir, fileReference.fileName);
            if (fs.existsSync(file)) {
                return file;
            }
            if (fs.existsSync(file + '.d.ts')) {
                return file + '.d.ts';
            }
        }).filter(function (f) { return !!f; });
        files = files
            .filter(function (f) { return !typings[path.basename(f)] || typings[path.basename(f)].version > Infinity; });
        files.forEach(function (f) { return typings[path.basename(f)] = { filePath: f, version: Infinity }; });
        files.forEach(function (f) { return addAllReferencedFilesWithMaxVersion(f); });
    }
    try {
        var node_modules = travelUpTheDirectoryTreeTillYouFind(projectDir, 'node_modules', true);
        var moduleDirs = getDirs(node_modules);
        for (var _i = 0, moduleDirs_1 = moduleDirs; _i < moduleDirs_1.length; _i++) {
            var moduleDir = moduleDirs_1[_i];
            try {
                var package_json = JSON.parse(fs.readFileSync(moduleDir + "/package.json").toString());
                packagejson.push(moduleDir + "/package.json");
            }
            catch (ex) {
                continue;
            }
            if (package_json.typescript && package_json.typescript.definition) {
                var file = path.resolve(moduleDir, './', package_json.typescript.definition);
                typings[path.basename(file)] = {
                    filePath: file,
                    version: Infinity
                };
                addAllReferencedFilesWithMaxVersion(file);
            }
        }
    }
    catch (ex) {
        if (ex.message == "not found") {
        }
        else {
            console.error('Failed to read package.json from node_modules due to error:', ex, ex.stack);
        }
    }
    var all = Object.keys(typings)
        .map(function (typing) { return typings[typing].filePath; })
        .map(function (x) { return fsu.consistentPath(x); });
    var implicit = all
        .filter(function (x) { return !existing[x]; });
    var ours = all
        .filter(function (x) { return existing[x]; });
    return { implicit: implicit, ours: ours, packagejson: packagejson };
}
function prettyJSON(object, indent, newLine) {
    if (indent === void 0) { indent = 4; }
    if (newLine === void 0) { newLine = os.EOL; }
    var cache = [];
    var value = JSON.stringify(object, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return;
            }
            cache.push(value);
        }
        return value;
    }, indent);
    value = value.replace(/(?:\r\n|\r|\n)/g, newLine) + newLine;
    cache = null;
    return value;
}
exports.prettyJSON = prettyJSON;
function pathIsRelative(str) {
    if (!str.length)
        return false;
    return str[0] == '.' || str.substring(0, 2) == "./" || str.substring(0, 3) == "../";
}
exports.pathIsRelative = pathIsRelative;
function selectMany(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr[i].length; j++) {
            result.push(arr[i][j]);
        }
    }
    return result;
}
function endsWith(str, suffix) {
    return str && str.indexOf(suffix, str.length - suffix.length) !== -1;
}
exports.endsWith = endsWith;
function uniq(arr) {
    var map = simpleValidator.createMap(arr);
    return Object.keys(map);
}
function makeRelativePath(relativeFolder, filePath) {
    var relativePath = path.relative(relativeFolder, filePath).split('\\').join('/');
    if (relativePath[0] !== '.') {
        relativePath = './' + relativePath;
    }
    return relativePath;
}
exports.makeRelativePath = makeRelativePath;
function removeExt(filePath) {
    return filePath.substr(0, filePath.lastIndexOf('.'));
}
exports.removeExt = removeExt;
function removeTrailingSlash(filePath) {
    if (!filePath)
        return filePath;
    if (endsWith(filePath, '/'))
        return filePath.substr(0, filePath.length - 1);
    return filePath;
}
exports.removeTrailingSlash = removeTrailingSlash;
function travelUpTheDirectoryTreeTillYouFind(dir, fileOrDirectory, abortIfInside) {
    if (abortIfInside === void 0) { abortIfInside = false; }
    while (fs.existsSync(dir)) {
        var potentialFile = dir + '/' + fileOrDirectory;
        if (before == potentialFile) {
            if (abortIfInside) {
                throw new Error("not found");
            }
        }
        if (fs.existsSync(potentialFile)) {
            return potentialFile;
        }
        else {
            var before = dir;
            dir = path.dirname(dir);
            if (dir == before)
                throw new Error("not found");
        }
    }
}
exports.travelUpTheDirectoryTreeTillYouFind = travelUpTheDirectoryTreeTillYouFind;
function getPotentiallyRelativeFile(basePath, filePath) {
    if (pathIsRelative(filePath)) {
        return fsu.consistentPath(path.resolve(basePath, filePath));
    }
    return fsu.consistentPath(filePath);
}
exports.getPotentiallyRelativeFile = getPotentiallyRelativeFile;
function getDirs(rootDir) {
    var files = fs.readdirSync(rootDir);
    var dirs = [];
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        if (file[0] != '.') {
            var filePath = rootDir + "/" + file;
            var stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                dirs.push(filePath);
            }
        }
    }
    return dirs;
}
function createMap(arr) {
    return arr.reduce(function (result, key) {
        result[key] = true;
        return result;
    }, {});
}
exports.createMap = createMap;
function reverseKeysAndValues(obj) {
    var toret = {};
    Object.keys(obj).forEach(function (key) {
        toret[obj[key]] = key;
    });
    return toret;
}
