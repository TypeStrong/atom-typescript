//
// Copyright (c) Microsoft Corporation.  All rights reserved.
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path='services.ts' />
var debugObjectHost = this;
var ts;
(function (ts) {
    function logInternalError(logger, err) {
        logger.log("*INTERNAL ERROR* - Exception in typescript services: " + err.message);
    }
    var ScriptSnapshotShimAdapter = (function () {
        function ScriptSnapshotShimAdapter(scriptSnapshotShim) {
            this.scriptSnapshotShim = scriptSnapshotShim;
            this.lineStartPositions = null;
        }
        ScriptSnapshotShimAdapter.prototype.getText = function (start, end) {
            return this.scriptSnapshotShim.getText(start, end);
        };
        ScriptSnapshotShimAdapter.prototype.getLength = function () {
            return this.scriptSnapshotShim.getLength();
        };
        ScriptSnapshotShimAdapter.prototype.getChangeRange = function (oldSnapshot) {
            var oldSnapshotShim = oldSnapshot;
            var encoded = this.scriptSnapshotShim.getChangeRange(oldSnapshotShim.scriptSnapshotShim);
            if (encoded == null) {
                return null;
            }
            var decoded = JSON.parse(encoded);
            return ts.createTextChangeRange(ts.createTextSpan(decoded.span.start, decoded.span.length), decoded.newLength);
        };
        return ScriptSnapshotShimAdapter;
    })();
    var LanguageServiceShimHostAdapter = (function () {
        function LanguageServiceShimHostAdapter(shimHost) {
            this.shimHost = shimHost;
        }
        LanguageServiceShimHostAdapter.prototype.log = function (s) {
            this.shimHost.log(s);
        };
        LanguageServiceShimHostAdapter.prototype.trace = function (s) {
            this.shimHost.trace(s);
        };
        LanguageServiceShimHostAdapter.prototype.error = function (s) {
            this.shimHost.error(s);
        };
        LanguageServiceShimHostAdapter.prototype.getCompilationSettings = function () {
            var settingsJson = this.shimHost.getCompilationSettings();
            if (settingsJson == null || settingsJson == "") {
                throw Error("LanguageServiceShimHostAdapter.getCompilationSettings: empty compilationSettings");
                return null;
            }
            return JSON.parse(settingsJson);
        };
        LanguageServiceShimHostAdapter.prototype.getScriptFileNames = function () {
            var encoded = this.shimHost.getScriptFileNames();
            return this.files = JSON.parse(encoded);
        };
        LanguageServiceShimHostAdapter.prototype.getScriptSnapshot = function (fileName) {
            if (this.files && this.files.indexOf(fileName) < 0) {
                return undefined;
            }
            var scriptSnapshot = this.shimHost.getScriptSnapshot(fileName);
            return scriptSnapshot && new ScriptSnapshotShimAdapter(scriptSnapshot);
        };
        LanguageServiceShimHostAdapter.prototype.getScriptVersion = function (fileName) {
            return this.shimHost.getScriptVersion(fileName);
        };
        LanguageServiceShimHostAdapter.prototype.getLocalizedDiagnosticMessages = function () {
            var diagnosticMessagesJson = this.shimHost.getLocalizedDiagnosticMessages();
            if (diagnosticMessagesJson == null || diagnosticMessagesJson == "") {
                return null;
            }
            try {
                return JSON.parse(diagnosticMessagesJson);
            }
            catch (e) {
                this.log(e.description || "diagnosticMessages.generated.json has invalid JSON format");
                return null;
            }
        };
        LanguageServiceShimHostAdapter.prototype.getCancellationToken = function () {
            return this.shimHost.getCancellationToken();
        };
        LanguageServiceShimHostAdapter.prototype.getCurrentDirectory = function () {
            return this.shimHost.getCurrentDirectory();
        };
        LanguageServiceShimHostAdapter.prototype.getDefaultLibFileName = function (options) {
            try {
                return this.shimHost.getDefaultLibFileName(JSON.stringify(options));
            }
            catch (e) {
                return "";
            }
        };
        return LanguageServiceShimHostAdapter;
    })();
    ts.LanguageServiceShimHostAdapter = LanguageServiceShimHostAdapter;
    var CoreServicesShimHostAdapter = (function () {
        function CoreServicesShimHostAdapter(shimHost) {
            this.shimHost = shimHost;
        }
        CoreServicesShimHostAdapter.prototype.readDirectory = function (rootDir, extension) {
            var encoded = this.shimHost.readDirectory(rootDir, extension);
            return JSON.parse(encoded);
        };
        return CoreServicesShimHostAdapter;
    })();
    ts.CoreServicesShimHostAdapter = CoreServicesShimHostAdapter;
    function simpleForwardCall(logger, actionDescription, action) {
        logger.log(actionDescription);
        var start = Date.now();
        var result = action();
        var end = Date.now();
        logger.log(actionDescription + " completed in " + (end - start) + " msec");
        if (typeof (result) === "string") {
            var str = result;
            if (str.length > 128) {
                str = str.substring(0, 128) + "...";
            }
            logger.log("  result.length=" + str.length + ", result='" + JSON.stringify(str) + "'");
        }
        return result;
    }
    function forwardJSONCall(logger, actionDescription, action) {
        try {
            var result = simpleForwardCall(logger, actionDescription, action);
            return JSON.stringify({ result: result });
        }
        catch (err) {
            if (err instanceof ts.OperationCanceledException) {
                return JSON.stringify({ canceled: true });
            }
            logInternalError(logger, err);
            err.description = actionDescription;
            return JSON.stringify({ error: err });
        }
    }
    var ShimBase = (function () {
        function ShimBase(factory) {
            this.factory = factory;
            factory.registerShim(this);
        }
        ShimBase.prototype.dispose = function (dummy) {
            this.factory.unregisterShim(this);
        };
        return ShimBase;
    })();
    function realizeDiagnostics(diagnostics, newLine) {
        return diagnostics.map(function (d) { return realizeDiagnostic(d, newLine); });
    }
    ts.realizeDiagnostics = realizeDiagnostics;
    function realizeDiagnostic(diagnostic, newLine) {
        return {
            message: ts.flattenDiagnosticMessageText(diagnostic.messageText, newLine),
            start: diagnostic.start,
            length: diagnostic.length,
            category: ts.DiagnosticCategory[diagnostic.category].toLowerCase(),
            code: diagnostic.code
        };
    }
    var LanguageServiceShimObject = (function (_super) {
        __extends(LanguageServiceShimObject, _super);
        function LanguageServiceShimObject(factory, host, languageService) {
            _super.call(this, factory);
            this.host = host;
            this.languageService = languageService;
            this.logger = this.host;
        }
        LanguageServiceShimObject.prototype.forwardJSONCall = function (actionDescription, action) {
            return forwardJSONCall(this.logger, actionDescription, action);
        };
        LanguageServiceShimObject.prototype.dispose = function (dummy) {
            this.logger.log("dispose()");
            this.languageService.dispose();
            this.languageService = null;
            if (debugObjectHost && debugObjectHost.CollectGarbage) {
                debugObjectHost.CollectGarbage();
                this.logger.log("CollectGarbage()");
            }
            this.logger = null;
            _super.prototype.dispose.call(this, dummy);
        };
        LanguageServiceShimObject.prototype.refresh = function (throwOnError) {
            this.forwardJSONCall("refresh(" + throwOnError + ")", function () {
                return null;
            });
        };
        LanguageServiceShimObject.prototype.cleanupSemanticCache = function () {
            var _this = this;
            this.forwardJSONCall("cleanupSemanticCache()", function () {
                _this.languageService.cleanupSemanticCache();
                return null;
            });
        };
        LanguageServiceShimObject.prototype.realizeDiagnostics = function (diagnostics) {
            var newLine = this.getNewLine();
            return ts.realizeDiagnostics(diagnostics, newLine);
        };
        LanguageServiceShimObject.prototype.getSyntacticClassifications = function (fileName, start, length) {
            var _this = this;
            return this.forwardJSONCall("getSyntacticClassifications('" + fileName + "', " + start + ", " + length + ")", function () {
                var classifications = _this.languageService.getSyntacticClassifications(fileName, ts.createTextSpan(start, length));
                return classifications;
            });
        };
        LanguageServiceShimObject.prototype.getSemanticClassifications = function (fileName, start, length) {
            var _this = this;
            return this.forwardJSONCall("getSemanticClassifications('" + fileName + "', " + start + ", " + length + ")", function () {
                var classifications = _this.languageService.getSemanticClassifications(fileName, ts.createTextSpan(start, length));
                return classifications;
            });
        };
        LanguageServiceShimObject.prototype.getNewLine = function () {
            return this.host.getNewLine ? this.host.getNewLine() : "\r\n";
        };
        LanguageServiceShimObject.prototype.getSyntacticDiagnostics = function (fileName) {
            var _this = this;
            return this.forwardJSONCall("getSyntacticDiagnostics('" + fileName + "')", function () {
                var diagnostics = _this.languageService.getSyntacticDiagnostics(fileName);
                return _this.realizeDiagnostics(diagnostics);
            });
        };
        LanguageServiceShimObject.prototype.getSemanticDiagnostics = function (fileName) {
            var _this = this;
            return this.forwardJSONCall("getSemanticDiagnostics('" + fileName + "')", function () {
                var diagnostics = _this.languageService.getSemanticDiagnostics(fileName);
                return _this.realizeDiagnostics(diagnostics);
            });
        };
        LanguageServiceShimObject.prototype.getCompilerOptionsDiagnostics = function () {
            var _this = this;
            return this.forwardJSONCall("getCompilerOptionsDiagnostics()", function () {
                var diagnostics = _this.languageService.getCompilerOptionsDiagnostics();
                return _this.realizeDiagnostics(diagnostics);
            });
        };
        LanguageServiceShimObject.prototype.getQuickInfoAtPosition = function (fileName, position) {
            var _this = this;
            return this.forwardJSONCall("getQuickInfoAtPosition('" + fileName + "', " + position + ")", function () {
                var quickInfo = _this.languageService.getQuickInfoAtPosition(fileName, position);
                return quickInfo;
            });
        };
        LanguageServiceShimObject.prototype.getNameOrDottedNameSpan = function (fileName, startPos, endPos) {
            var _this = this;
            return this.forwardJSONCall("getNameOrDottedNameSpan('" + fileName + "', " + startPos + ", " + endPos + ")", function () {
                var spanInfo = _this.languageService.getNameOrDottedNameSpan(fileName, startPos, endPos);
                return spanInfo;
            });
        };
        LanguageServiceShimObject.prototype.getBreakpointStatementAtPosition = function (fileName, position) {
            var _this = this;
            return this.forwardJSONCall("getBreakpointStatementAtPosition('" + fileName + "', " + position + ")", function () {
                var spanInfo = _this.languageService.getBreakpointStatementAtPosition(fileName, position);
                return spanInfo;
            });
        };
        LanguageServiceShimObject.prototype.getSignatureHelpItems = function (fileName, position) {
            var _this = this;
            return this.forwardJSONCall("getSignatureHelpItems('" + fileName + "', " + position + ")", function () {
                var signatureInfo = _this.languageService.getSignatureHelpItems(fileName, position);
                return signatureInfo;
            });
        };
        LanguageServiceShimObject.prototype.getDefinitionAtPosition = function (fileName, position) {
            var _this = this;
            return this.forwardJSONCall("getDefinitionAtPosition('" + fileName + "', " + position + ")", function () {
                return _this.languageService.getDefinitionAtPosition(fileName, position);
            });
        };
        LanguageServiceShimObject.prototype.getRenameInfo = function (fileName, position) {
            var _this = this;
            return this.forwardJSONCall("getRenameInfo('" + fileName + "', " + position + ")", function () {
                return _this.languageService.getRenameInfo(fileName, position);
            });
        };
        LanguageServiceShimObject.prototype.findRenameLocations = function (fileName, position, findInStrings, findInComments) {
            var _this = this;
            return this.forwardJSONCall("findRenameLocations('" + fileName + "', " + position + ", " + findInStrings + ", " + findInComments + ")", function () {
                return _this.languageService.findRenameLocations(fileName, position, findInStrings, findInComments);
            });
        };
        LanguageServiceShimObject.prototype.getBraceMatchingAtPosition = function (fileName, position) {
            var _this = this;
            return this.forwardJSONCall("getBraceMatchingAtPosition('" + fileName + "', " + position + ")", function () {
                var textRanges = _this.languageService.getBraceMatchingAtPosition(fileName, position);
                return textRanges;
            });
        };
        LanguageServiceShimObject.prototype.getIndentationAtPosition = function (fileName, position, options) {
            var _this = this;
            return this.forwardJSONCall("getIndentationAtPosition('" + fileName + "', " + position + ")", function () {
                var localOptions = JSON.parse(options);
                return _this.languageService.getIndentationAtPosition(fileName, position, localOptions);
            });
        };
        LanguageServiceShimObject.prototype.getReferencesAtPosition = function (fileName, position) {
            var _this = this;
            return this.forwardJSONCall("getReferencesAtPosition('" + fileName + "', " + position + ")", function () {
                return _this.languageService.getReferencesAtPosition(fileName, position);
            });
        };
        LanguageServiceShimObject.prototype.findReferences = function (fileName, position) {
            var _this = this;
            return this.forwardJSONCall("findReferences('" + fileName + "', " + position + ")", function () {
                return _this.languageService.findReferences(fileName, position);
            });
        };
        LanguageServiceShimObject.prototype.getOccurrencesAtPosition = function (fileName, position) {
            var _this = this;
            return this.forwardJSONCall("getOccurrencesAtPosition('" + fileName + "', " + position + ")", function () {
                return _this.languageService.getOccurrencesAtPosition(fileName, position);
            });
        };
        LanguageServiceShimObject.prototype.getDocumentHighlights = function (fileName, position, filesToSearch) {
            var _this = this;
            return this.forwardJSONCall("getDocumentHighlights('" + fileName + "', " + position + ")", function () {
                return _this.languageService.getDocumentHighlights(fileName, position, JSON.parse(filesToSearch));
            });
        };
        LanguageServiceShimObject.prototype.getCompletionsAtPosition = function (fileName, position) {
            var _this = this;
            return this.forwardJSONCall("getCompletionsAtPosition('" + fileName + "', " + position + ")", function () {
                var completion = _this.languageService.getCompletionsAtPosition(fileName, position);
                return completion;
            });
        };
        LanguageServiceShimObject.prototype.getCompletionEntryDetails = function (fileName, position, entryName) {
            var _this = this;
            return this.forwardJSONCall("getCompletionEntryDetails('" + fileName + "', " + position + ", " + entryName + ")", function () {
                var details = _this.languageService.getCompletionEntryDetails(fileName, position, entryName);
                return details;
            });
        };
        LanguageServiceShimObject.prototype.getFormattingEditsForRange = function (fileName, start, end, options) {
            var _this = this;
            return this.forwardJSONCall("getFormattingEditsForRange('" + fileName + "', " + start + ", " + end + ")", function () {
                var localOptions = JSON.parse(options);
                var edits = _this.languageService.getFormattingEditsForRange(fileName, start, end, localOptions);
                return edits;
            });
        };
        LanguageServiceShimObject.prototype.getFormattingEditsForDocument = function (fileName, options) {
            var _this = this;
            return this.forwardJSONCall("getFormattingEditsForDocument('" + fileName + "')", function () {
                var localOptions = JSON.parse(options);
                var edits = _this.languageService.getFormattingEditsForDocument(fileName, localOptions);
                return edits;
            });
        };
        LanguageServiceShimObject.prototype.getFormattingEditsAfterKeystroke = function (fileName, position, key, options) {
            var _this = this;
            return this.forwardJSONCall("getFormattingEditsAfterKeystroke('" + fileName + "', " + position + ", '" + key + "')", function () {
                var localOptions = JSON.parse(options);
                var edits = _this.languageService.getFormattingEditsAfterKeystroke(fileName, position, key, localOptions);
                return edits;
            });
        };
        LanguageServiceShimObject.prototype.getNavigateToItems = function (searchValue, maxResultCount) {
            var _this = this;
            return this.forwardJSONCall("getNavigateToItems('" + searchValue + "', " + maxResultCount + ")", function () {
                var items = _this.languageService.getNavigateToItems(searchValue, maxResultCount);
                return items;
            });
        };
        LanguageServiceShimObject.prototype.getNavigationBarItems = function (fileName) {
            var _this = this;
            return this.forwardJSONCall("getNavigationBarItems('" + fileName + "')", function () {
                var items = _this.languageService.getNavigationBarItems(fileName);
                return items;
            });
        };
        LanguageServiceShimObject.prototype.getOutliningSpans = function (fileName) {
            var _this = this;
            return this.forwardJSONCall("getOutliningSpans('" + fileName + "')", function () {
                var items = _this.languageService.getOutliningSpans(fileName);
                return items;
            });
        };
        LanguageServiceShimObject.prototype.getTodoComments = function (fileName, descriptors) {
            var _this = this;
            return this.forwardJSONCall("getTodoComments('" + fileName + "')", function () {
                var items = _this.languageService.getTodoComments(fileName, JSON.parse(descriptors));
                return items;
            });
        };
        LanguageServiceShimObject.prototype.getEmitOutput = function (fileName) {
            var _this = this;
            return this.forwardJSONCall("getEmitOutput('" + fileName + "')", function () {
                var output = _this.languageService.getEmitOutput(fileName);
                output.emitOutputStatus = output.emitSkipped ? 1 : 0;
                return output;
            });
        };
        return LanguageServiceShimObject;
    })(ShimBase);
    var ClassifierShimObject = (function (_super) {
        __extends(ClassifierShimObject, _super);
        function ClassifierShimObject(factory) {
            _super.call(this, factory);
            this.classifier = ts.createClassifier();
        }
        ClassifierShimObject.prototype.getClassificationsForLine = function (text, lexState, classifyKeywordsInGenerics) {
            var classification = this.classifier.getClassificationsForLine(text, lexState, classifyKeywordsInGenerics);
            var items = classification.entries;
            var result = "";
            for (var i = 0; i < items.length; i++) {
                result += items[i].length + "\n";
                result += items[i].classification + "\n";
            }
            result += classification.finalLexState;
            return result;
        };
        return ClassifierShimObject;
    })(ShimBase);
    var CoreServicesShimObject = (function (_super) {
        __extends(CoreServicesShimObject, _super);
        function CoreServicesShimObject(factory, logger, host) {
            _super.call(this, factory);
            this.logger = logger;
            this.host = host;
        }
        CoreServicesShimObject.prototype.forwardJSONCall = function (actionDescription, action) {
            return forwardJSONCall(this.logger, actionDescription, action);
        };
        CoreServicesShimObject.prototype.getPreProcessedFileInfo = function (fileName, sourceTextSnapshot) {
            return this.forwardJSONCall("getPreProcessedFileInfo('" + fileName + "')", function () {
                var result = ts.preProcessFile(sourceTextSnapshot.getText(0, sourceTextSnapshot.getLength()));
                var convertResult = {
                    referencedFiles: [],
                    importedFiles: [],
                    isLibFile: result.isLibFile
                };
                ts.forEach(result.referencedFiles, function (refFile) {
                    convertResult.referencedFiles.push({
                        path: ts.normalizePath(refFile.fileName),
                        position: refFile.pos,
                        length: refFile.end - refFile.pos
                    });
                });
                ts.forEach(result.importedFiles, function (importedFile) {
                    convertResult.importedFiles.push({
                        path: ts.normalizeSlashes(importedFile.fileName),
                        position: importedFile.pos,
                        length: importedFile.end - importedFile.pos
                    });
                });
                return convertResult;
            });
        };
        CoreServicesShimObject.prototype.getTSConfigFileInfo = function (fileName, sourceTextSnapshot) {
            var _this = this;
            return this.forwardJSONCall("getTSConfigFileInfo('" + fileName + "')", function () {
                var text = sourceTextSnapshot.getText(0, sourceTextSnapshot.getLength());
                var result = ts.parseConfigFileText(fileName, text);
                if (result.error) {
                    return {
                        options: {},
                        files: [],
                        errors: [realizeDiagnostic(result.error, '\r\n')]
                    };
                }
                var configFile = ts.parseConfigFile(result.config, _this.host, ts.getDirectoryPath(ts.normalizeSlashes(fileName)));
                return {
                    options: configFile.options,
                    files: configFile.fileNames,
                    errors: realizeDiagnostics(configFile.errors, '\r\n')
                };
            });
        };
        CoreServicesShimObject.prototype.getDefaultCompilationSettings = function () {
            return this.forwardJSONCall("getDefaultCompilationSettings()", function () {
                return ts.getDefaultCompilerOptions();
            });
        };
        return CoreServicesShimObject;
    })(ShimBase);
    var TypeScriptServicesFactory = (function () {
        function TypeScriptServicesFactory() {
            this._shims = [];
            this.documentRegistry = ts.createDocumentRegistry();
        }
        TypeScriptServicesFactory.prototype.getServicesVersion = function () {
            return ts.servicesVersion;
        };
        TypeScriptServicesFactory.prototype.createLanguageServiceShim = function (host) {
            try {
                var hostAdapter = new LanguageServiceShimHostAdapter(host);
                var languageService = ts.createLanguageService(hostAdapter, this.documentRegistry);
                return new LanguageServiceShimObject(this, host, languageService);
            }
            catch (err) {
                logInternalError(host, err);
                throw err;
            }
        };
        TypeScriptServicesFactory.prototype.createClassifierShim = function (logger) {
            try {
                return new ClassifierShimObject(this);
            }
            catch (err) {
                logInternalError(logger, err);
                throw err;
            }
        };
        TypeScriptServicesFactory.prototype.createCoreServicesShim = function (host) {
            try {
                var adapter = new CoreServicesShimHostAdapter(host);
                return new CoreServicesShimObject(this, host, adapter);
            }
            catch (err) {
                logInternalError(host, err);
                throw err;
            }
        };
        TypeScriptServicesFactory.prototype.close = function () {
            this._shims = [];
            this.documentRegistry = ts.createDocumentRegistry();
        };
        TypeScriptServicesFactory.prototype.registerShim = function (shim) {
            this._shims.push(shim);
        };
        TypeScriptServicesFactory.prototype.unregisterShim = function (shim) {
            for (var i = 0, n = this._shims.length; i < n; i++) {
                if (this._shims[i] === shim) {
                    delete this._shims[i];
                    return;
                }
            }
            throw new Error("Invalid operation");
        };
        return TypeScriptServicesFactory;
    })();
    ts.TypeScriptServicesFactory = TypeScriptServicesFactory;
    if (typeof module !== "undefined" && module.exports) {
        module.exports = ts;
    }
})(ts || (ts = {}));
var TypeScript;
(function (TypeScript) {
    var Services;
    (function (Services) {
        Services.TypeScriptServicesFactory = ts.TypeScriptServicesFactory;
    })(Services = TypeScript.Services || (TypeScript.Services = {}));
})(TypeScript || (TypeScript = {}));
var toolsVersion = "1.4";
