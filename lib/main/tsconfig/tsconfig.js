exports.errors = {
    GET_PROJECT_INVALID_PATH: 'Invalid Path',
    GET_PROJECT_NO_PROJECT_FOUND: 'No Project Found',
    GET_PROJECT_FAILED_TO_OPEN_PROJECT_FILE: 'Failed to fs.readFileSync the project file',
    GET_PROJECT_JSON_PARSE_FAILED: 'Failed to JSON.parse the project file',
    CREATE_FILE_MUST_EXIST: 'To create a project the file must exist',
    CREATE_PROJECT_ALREADY_EXISTS: 'Project file already exists',
};
var fs = require('fs');
var path = require('path');
var expand = require('glob-expand');
var ts = require('typescript');
var formatting = require('./formatting');
var projectFileName = 'tsconfig.json';
var defaultFilesGlob = ["./**/*.ts", "!./node_modules/**/*.ts"];
exports.defaults = {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    declaration: false,
    noImplicitAny: false,
    removeComments: true,
    noLib: false
};
var deprecatedKeys = {
    outdir: 'outDir',
    noimplicitany: 'noImplicitAny',
    removecomments: 'removeComments',
    sourcemap: 'sourceMap',
    sourceroot: 'sourceRoot',
    maproot: 'mapRoot',
    nolib: 'noLib'
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
        'amd': ts.ModuleKind.AMD
    }
};
var jsonEnumMap = {
    target: (function () {
        var map = {};
        map[ts.ScriptTarget.ES3] = 'es3';
        map[ts.ScriptTarget.ES5] = 'es5';
        map[ts.ScriptTarget.ES6] = 'es6';
        map[ts.ScriptTarget.Latest] = 'latest';
        return map;
    })(),
    module: (function () {
        var map = {};
        map[ts.ModuleKind.None] = 'none';
        map[ts.ModuleKind.CommonJS] = 'commonjs';
        map[ts.ModuleKind.AMD] = 'amd';
        return map;
    })()
};
function mixin(target, source) {
    for (var key in source) {
        target[key] = source[key];
    }
    return target;
}
function rawToTsCompilerOptions(jsonOptions, projectDir) {
    var compilerOptions = mixin({}, exports.defaults);
    for (var key in jsonOptions) {
        if (deprecatedKeys[key]) {
            key = deprecatedKeys[key];
        }
        if (typescriptEnumMap[key]) {
            compilerOptions[key] = typescriptEnumMap[key][jsonOptions[key].toLowerCase()];
        }
        else {
            compilerOptions[key] = jsonOptions[key];
        }
    }
    if (compilerOptions.outDir !== undefined) {
        compilerOptions.outDir = path.resolve(projectDir, compilerOptions.outDir);
    }
    if (compilerOptions.out !== undefined) {
        compilerOptions.out = path.resolve(projectDir, compilerOptions.out);
    }
    return compilerOptions;
}
function tsToRawCompilerOptions(compilerOptions) {
    var jsonOptions = mixin({}, compilerOptions);
    if (compilerOptions.target !== undefined) {
        jsonOptions.target = jsonEnumMap.target[compilerOptions.target];
    }
    if (compilerOptions.module !== undefined) {
        jsonOptions.module = jsonEnumMap.module[compilerOptions.module];
    }
    return jsonOptions;
}
function getProjectSync(pathOrSrcFile) {
    if (!fs.existsSync(pathOrSrcFile))
        throw new Error(exports.errors.GET_PROJECT_INVALID_PATH);
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);
    if (dir !== pathOrSrcFile) {
        if (endsWith(pathOrSrcFile.toLowerCase(), '.d.ts')) {
            return {
                projectFileDirectory: dir,
                projectFilePath: dir + '/' + projectFileName,
                project: {
                    compilerOptions: exports.defaults,
                    files: [pathOrSrcFile],
                    format: formatting.defaultFormatCodeOptions()
                },
            };
        }
    }
    var projectFile = '';
    while (fs.existsSync(dir)) {
        var potentialProjectFile = dir + '/' + projectFileName;
        if (fs.existsSync(potentialProjectFile)) {
            projectFile = potentialProjectFile;
            break;
        }
        else {
            var before = dir;
            dir = path.dirname(dir);
            if (dir == before)
                throw new Error(exports.errors.GET_PROJECT_NO_PROJECT_FOUND);
        }
    }
    projectFile = path.normalize(projectFile);
    var projectFileDirectory = path.dirname(projectFile) + path.sep;
    var projectSpec;
    try {
        var projectFileTextContent = fs.readFileSync(projectFile, 'utf8');
    }
    catch (ex) {
        throw new Error(exports.errors.GET_PROJECT_FAILED_TO_OPEN_PROJECT_FILE);
    }
    try {
        projectSpec = JSON.parse(projectFileTextContent);
    }
    catch (ex) {
        throw new Error(exports.errors.GET_PROJECT_JSON_PARSE_FAILED);
    }
    if (!projectSpec.compilerOptions)
        projectSpec.compilerOptions = {};
    var cwdPath = path.relative(process.cwd(), path.dirname(projectFile));
    if (!projectSpec.files) {
        projectSpec.filesGlob = defaultFilesGlob;
    }
    if (projectSpec.filesGlob) {
        projectSpec.files = expand({ filter: 'isFile', cwd: cwdPath }, projectSpec.filesGlob);
        fs.writeFileSync(projectFile, prettyJSON(projectSpec));
    }
    projectSpec.files = projectSpec.files.map(function (file) { return path.resolve(projectFileDirectory, file); });
    var project = {
        compilerOptions: {},
        files: projectSpec.files,
        format: formatting.makeFormatCodeOptions(projectSpec.format),
    };
    project.compilerOptions = rawToTsCompilerOptions(projectSpec.compilerOptions, projectFileDirectory);
    project.files = increaseProjectForReferenceAndImports(project.files);
    project.files = uniq(project.files.map(consistentPath));
    return {
        projectFileDirectory: projectFileDirectory,
        projectFilePath: projectFileDirectory + '/' + projectFileName,
        project: project
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
    projectSpec.filesGlob = defaultFilesGlob;
    fs.writeFileSync(projectFilePath, prettyJSON(projectSpec));
    return getProjectSync(srcFile);
}
exports.createProjectRootSync = createProjectRootSync;
function consistentPath(filePath) {
    return filePath.split('\\').join('/');
}
exports.consistentPath = consistentPath;
function increaseProjectForReferenceAndImports(files) {
    var filesMap = createMap(files);
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
            referenced.push(preProcessedFileInfo.referencedFiles.map(function (fileReference) { return path.resolve(dir, fileReference.filename); }).concat(preProcessedFileInfo.importedFiles.filter(function (fileReference) { return pathIsRelative(fileReference.filename); }).map(function (fileReference) {
                var file = path.resolve(dir, fileReference.filename + '.ts');
                if (!fs.existsSync(file)) {
                    file = path.resolve(dir, fileReference.filename + '.d.ts');
                }
                return file;
            })));
        });
        return selectMany(referenced);
    };
    var more = getReferencedOrImportedFiles(files).filter(willNeedMoreAnalysis);
    while (more.length) {
        more = getReferencedOrImportedFiles(files).filter(willNeedMoreAnalysis);
    }
    return files;
}
function createMap(arr) {
    return arr.reduce(function (result, key) {
        result[key] = true;
        return result;
    }, {});
}
function prettyJSON(object) {
    var cache = [];
    var value = JSON.stringify(object, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                return;
            }
            cache.push(value);
        }
        return value;
    }, 4);
    cache = null;
    return value;
}
function pathIsRelative(str) {
    if (!str.length)
        return false;
    return str[0] == '.' || str.substring(0, 2) == "./" || str.substring(0, 3) == "../";
}
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
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
function uniq(arr) {
    var map = createMap(arr);
    return Object.keys(map);
}
