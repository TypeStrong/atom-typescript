//   Copyright 2013-2014 François de Campredon
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.

'use strict';

import path = require('path');
import minimatch = require('minimatch');
import Promise = require('bluebird');
import PromiseQueue = require('../commons/promiseQueue');
import Services = TypeScript.Services;

import collections = require('../commons/collections');
import fs = require('../commons/fileSystem');
import ws = require('../commons/workingSet');
import logger = require('../commons/logger');
import TypeScriptProjectConfig = require('../commons/projectConfig');
import utils = require('../commons/utils');

import LanguageServiceHost = require('./languageServiceHost');

//--------------------------------------------------------------------------
//
//  TypeScriptProject
//
//--------------------------------------------------------------------------


/**
 * class representing a typescript project, responsible of synchronizing 
 * languageServiceHost with the file system
 */
class TypeScriptProject {
    
    //-------------------------------
    //  constructor
    //-------------------------------
     
    /**
     * @param baseDirectory the baseDirectory of the project
     * @param config the project config file
     * @param fileSystem the fileSystem wrapper used by the project
     * @param workingSet the working set wrapper used by the project
     * @param defaultLibLocation the location of the default compiler 'lib.d.ts' file
     */
    constructor(
        private baseDirectory: string,
        private config: TypeScriptProjectConfig, 
        private fileSystem: fs.IFileSystem,
        private workingSet: ws.IWorkingSet,
        private defaultLibLocation: string
    ) {}
    
    //-------------------------------
    //  variables
    //-------------------------------
    
    /**
     * TypeScript CoreServices instance used by these project 
     */
    private coreService: Services.CoreServices;
    
    /**
     * Language Service host instance managed by this service
     */
    private languageServiceHost: LanguageServiceHost;
    
    /**
     * LanguageService managed by this project
     */
    private languageService: Services.ILanguageService;
    
    /**
     * Map path to content
     */
    private projectFilesSet: collections.StringSet;
    
    /**
     * store file references
     */
    private references: collections.StringMap<collections.StringSet>;
    
    
    /**
     * a promise queue used to run in sequence file based operation
     */
    private queue: PromiseQueue = new PromiseQueue();
    
    /**
     * location of the typescript 'lib.d.ts' file
     */
    private libLocation: string;
    
    
    //-------------------------------
    //  public methods
    //-------------------------------
    
    /**
     * Initialize the project an his component
     */
    init(): Promise<void> {
        this.projectFilesSet = new collections.StringSet();
        this.references = new collections.StringMap<collections.StringSet>();
        this.workingSet.workingSetChanged.add(this.workingSetChangedHandler);
        this.workingSet.documentEdited.add(this.documentEditedHandler);
        this.fileSystem.projectFilesChanged.add(this.filesChangeHandler);
        
        return this.queue.init(
            this.getTypeScriptInfosForPath(this.config.typescriptPath).then(typeScriptInfo => {
                this.libLocation = typeScriptInfo.libLocation;
                this.coreService = typeScriptInfo.factory.createCoreServices({ logger: new logger.LogingClass()});
                this.languageServiceHost = new LanguageServiceHost();
                this.languageServiceHost.setCompilationSettings(this.createCompilationSettings());
                this.languageService = typeScriptInfo.factory.createPullLanguageService(this.languageServiceHost);

                return this.collectFiles();
                
            }).then(() => {
                this.updateWorkingSet();
            })
        );
    }
    
    /**
     * update a project with a new config
     */
    update(config: TypeScriptProjectConfig): Promise<void> {
        
        if (this.config.typescriptPath !== config.typescriptPath) {
            return this.init();
        }
        
        if (!this.config.noLib && config.noLib) {
            this.removeFile(this.libLocation);
        }
        
        var pojectSources = this.projectFilesSet.values.filter(fileName => this.isProjectSourceFile(fileName));
        this.config = config;
        return this.queue.then(() => {
            this.languageServiceHost.setCompilationSettings(this.createCompilationSettings());
            var promises: Promise<any>[] = [];
            pojectSources.forEach(fileName => {
                if (!this.isProjectSourceFile(fileName)) {
                    this.removeFile(fileName);
                }    
            });
            
            return Promise.all(promises)
                .then(() => this.collectFiles())
                .then(() => this.updateWorkingSet());
        });
    }
    
    /**
     * dispose the project
     */
    dispose() {
        this.workingSet.workingSetChanged.remove(this.workingSetChangedHandler);
        this.workingSet.documentEdited.remove(this.documentEditedHandler);
        this.fileSystem.projectFilesChanged.remove(this.filesChangeHandler);
    }
    
    //-------------------------------
    //  exposed services
    //-------------------------------
    
    /**
     * return the language service host of the project
     */
    getLanguageServiceHost(): LanguageServiceHost {
        return this.languageServiceHost;
    }
    
    /**
     * return the core service used by the project
     */
    getCoreService(): Services.CoreServices {
        return this.coreService;
    }
    
    /**
     * return the languageService used by the project
     */
    getLanguageService(): Services.ILanguageService {
        return this.languageService;
    }
    
    
    
    
    //-------------------------------
    //  exposed files informations
    //-------------------------------
    /**
     * return the set of files contained in the project
     */
    getProjectFilesSet() {
        return new collections.StringSet(this.projectFilesSet.values);
    }
    
    /**
     * for a given path, give the relation between the project an the associated file
     * @param path
     */
    getProjectFileKind(fileName: string): TypeScriptProject.ProjectFileKind {
        if (this.projectFilesSet.has(fileName)) {
            return this.isProjectSourceFile(fileName) ? 
                TypeScriptProject.ProjectFileKind.SOURCE :  
                TypeScriptProject.ProjectFileKind.REFERENCE
            ;
        } else {
            return TypeScriptProject.ProjectFileKind.NONE;
        }
    }
    
    
    //-------------------------------
    //  private methods
    //-------------------------------
    
    /**
     * Retrieve a ServiceFactory from a given typeScriptService file path
     * @param typescriptPath
     */
    private getTypeScriptInfosForPath(typescriptPath: string): Promise<TypeScriptInfo> {
        if (!typescriptPath) {
            return Promise.cast({
                factory: new Services.TypeScriptServicesFactory(),
                libLocation: this.defaultLibLocation
            });
        } else {
            var typescriptServicesFile = path.join(typescriptPath, 'typescriptServices.js');
            
            return this.fileSystem.readFile(typescriptServicesFile).then(code => {
                var func = new Function('var TypeScript;' + code + ';return TypeScript;'),
                    typeScript: typeof TypeScript = func();
                

                return {
                    factory: new typeScript.Services.TypeScriptServicesFactory(),
                    libLocation: path.join(typescriptPath, 'lib.d.ts')
                };
            })
            //TODO instead of silently returning default we should handle this error in project
            //manager and return an error in the linter
            .catch(() => {
                if (logger.error()) {
                    logger.log('could not retrieve typescript compiler at path: ' + typescriptPath);
                }
                return {
                    factory: new Services.TypeScriptServicesFactory(),
                    libLocation: this.defaultLibLocation
                };
            });
        }
    }
    
    /**
     * create Typescript compilation settings from config file
     */
    private createCompilationSettings(): TypeScript.CompilationSettings {
        var compilationSettings = new TypeScript.CompilationSettings(),
            moduleType = this.config.module.toLowerCase();
        
        compilationSettings.noLib = this.config.noLib;
        compilationSettings.noImplicitAny = this.config.noImplicitAny;
        compilationSettings.sourceRoot = this.config.sourceRoot;
        
        compilationSettings.codeGenTarget = 
            this.config.target.toLowerCase() === 'es3' ? 
                TypeScript.LanguageVersion.EcmaScript3 : 
                TypeScript.LanguageVersion.EcmaScript5;
        
        compilationSettings.moduleGenTarget = 
            moduleType === 'none' ? 
                TypeScript.ModuleGenTarget.Unspecified : 
                moduleType === 'amd' ?
                    TypeScript.ModuleGenTarget.Asynchronous :
                    TypeScript.ModuleGenTarget.Synchronous
            ;
        
        return compilationSettings;
    }
    
    /**
     * update the languageService host script 'open' status 
     * according to file in the working set
     */
    private updateWorkingSet() {
        this.workingSet.getFiles().then(files => files.forEach(fileName => {
            if (this.projectFilesSet.has(fileName)) {
                this.languageServiceHost.setScriptIsOpen(fileName, true);
            }
        }));
    }
    
    
    //-------------------------------
    //  Project Files Management
    //-------------------------------
    
    /**
     * retrieve files content for path match described in the config
     */
    private collectFiles(): Promise<any> { 
        return this.fileSystem.getProjectFiles().then(files => {
            var promises: Promise<any>[] = [];
            files.forEach(fileName => {
                if (this.isProjectSourceFile(fileName) && !this.projectFilesSet.has(fileName)) {
                    console.log(fileName);
                    promises.push(this.addFile(fileName, false));
                }
            });
            
            if (!this.config.noLib && !this.projectFilesSet.has(this.libLocation)) {
                promises.push(this.addFile(this.libLocation));
            }
            
            return Promise.all(promises);
        });
    }
    
    /**
     * return true a if a given file path match the config
     * @param path
     */
    private isProjectSourceFile(fileName: string): boolean {
        var relativeFileName = path.relative(this.baseDirectory, fileName);
        return this.config.sources.some(pattern => minimatch(relativeFileName, pattern) || minimatch(fileName, pattern));
    }
    
   
    /**
     * add a file to the project and all file that this file reference
     * @param path
     */
    private addFile(fileName: string, notify = true): Promise<any>  {
        if (!this.projectFilesSet.has(fileName)) {
            this.projectFilesSet.add(fileName);
            return this.fileSystem.readFile(fileName).then(content => {
                var promises: Promise<any>[] = [];
                this.languageServiceHost.addScript(fileName, content);
                this.getReferencedOrImportedFiles(fileName).forEach(referencedFile => {
                    promises.push(this.addFile(referencedFile));
                    this.addReference(fileName, referencedFile);
                });
                return Promise.all(promises);
            }, (): any => {
                this.projectFilesSet.remove(fileName);
            });
        }
        return null;
    }
    
    
    /**
     * remove a file from the project
     * @param path
     */
    private removeFile(fileName: string) {
        if (this.projectFilesSet.has(fileName)) {
            this.getReferencedOrImportedFiles(fileName).forEach((referencedPath: string) => {
                this.removeReference(fileName, referencedPath);
            });
            this.projectFilesSet.remove(fileName);
            this.languageServiceHost.removeScript(fileName);
        }
    }
    
    /**
     * update a project file
     * @param path
     */
    private updateFile(fileName: string) {
        this.fileSystem.readFile(fileName).then(content => {
            var oldPaths = new collections.StringSet(this.getReferencedOrImportedFiles(fileName));
            this.languageServiceHost.updateScript(fileName, content);
            this.updateReferences(fileName, oldPaths);
        });
    }
    
    
 
    
    
    //-------------------------------
    //  References
    //-------------------------------
    
    /**
     * for a given file retrives the file referenced or imported by this file
     * @param path
     */
    private getReferencedOrImportedFiles(fileName: string): string[] {
        if (!this.projectFilesSet.has(fileName)) {
            return [];
        }
        var script = this.languageServiceHost.getScriptSnapshot(fileName),
            preProcessedFileInfo = this.coreService.getPreProcessedFileInfo(fileName, script),
            dir = path.dirname(fileName);
        
        return preProcessedFileInfo.referencedFiles.map(fileReference => {
            return utils.pathResolve(dir, fileReference.path);
        }).concat(preProcessedFileInfo.importedFiles.map(fileReference => {
            return utils.pathResolve(dir, fileReference.path + '.ts');
        }));
    }
    
    /**
     * add a reference 
     * 
     * @param fileName the path of the file referencing anothe file
     * @param referencedPath the path of the file referenced
     */
    private addReference(fileName: string, referencedPath: string) {
        if (!this.references.has(referencedPath)) {
            this.references.set(referencedPath, new collections.StringSet());
        }
        this.references.get(referencedPath).add(fileName);
    }
    
    /**
     * remove a reference
     * 
     * @param fileName the path of the file referencing anothe file
     * @param referencedPath the path of the file referenced
     */
    private removeReference(fileName: string, referencedPath: string) {
        var fileRefs = this.references.get(referencedPath);
        if (!fileRefs) {
            this.removeFile(referencedPath);
        }
        fileRefs.remove(fileName);
        if (fileRefs.values.length === 0) {
            this.references.delete(referencedPath);
            this.removeFile(referencedPath);
        }   
    }
    
    /**
     * update file references after an update
     * 
     * @param fileName the absolute path of the file
     * @param oldFileReferences list of file this file referenced before being updated
     */
    private updateReferences(fileName: string, oldFileReferences: collections.StringSet) {
        this.getReferencedOrImportedFiles(fileName).forEach(referencedPath => {
            oldFileReferences.remove(referencedPath);
            if (!this.projectFilesSet.has(referencedPath)) {
                this.addFile(referencedPath);
                this.addReference(fileName, referencedPath);
            }
        });
        
        oldFileReferences.values.forEach(referencedPath => this.removeReference(fileName, referencedPath));
    }
    
    
    //-------------------------------
    //  Events Handler
    //-------------------------------
    
    /**
     * handle changes in the fileSystem
     */
    private filesChangeHandler = (changeRecords: fs.FileChangeRecord[]) => {
        this.queue.then(() => {
            changeRecords.forEach(record => {
                switch (record.kind) { 
                    case fs.FileChangeKind.ADD:
                        if (this.isProjectSourceFile(record.fileName) || this.references.has(record.fileName)) {
                            this.addFile(record.fileName);
                        }
                        break;
                    case fs.FileChangeKind.DELETE:
                        if (this.projectFilesSet.has(record.fileName)) {
                            this.removeFile(record.fileName);
                        }
                        break;
                    case fs.FileChangeKind.UPDATE:
                        if (this.projectFilesSet.has(record.fileName)) {
                            this.updateFile(record.fileName);
                        }
                        break;
                }
            });
        });
    };
    
    /**
     * handle changes in the workingSet
     */
    private workingSetChangedHandler = (changeRecord:  ws.WorkingSetChangeRecord) => {
        this.queue.then(() => {
            switch (changeRecord.kind) { 
                case ws.WorkingSetChangeKind.ADD:
                    changeRecord.paths.forEach(fileName  => {
                        if (this.projectFilesSet.has(fileName)) {
                            this.languageServiceHost.setScriptIsOpen(fileName, true);
                        }
                    });
                    break;
                case ws.WorkingSetChangeKind.REMOVE:
                    changeRecord.paths.forEach(fileName  => {
                        if (this.projectFilesSet.has(fileName)) {
                            this.languageServiceHost.setScriptIsOpen(fileName, false);
                            this.updateFile(fileName);
                        }
                    });
                    break;
            }
        });
    };
    
    /**
     * handle document edition
     */
    private documentEditedHandler = (record: ws.DocumentChangeRecord) => {
        this.queue.then(() => {
            if (this.projectFilesSet.has(record.path)) {
                var mustUpdate: boolean = false,
                    oldPaths = new collections.StringSet(this.getReferencedOrImportedFiles(record.path)),
                    lastChange: ws.DocumentChangeDescriptor;
                record.changeList.some(change => {
                    lastChange = change;
                    if (!change.from || !change.to) {
                        mustUpdate = true;
                    } else {
                        var minChar = this.languageServiceHost.getIndexFromPos(record.path, change.from),
                            limChar = this.languageServiceHost.getIndexFromPos(record.path, change.to);

                        this.languageServiceHost.editScript(record.path, minChar, limChar, change.text);
                    }
                    return mustUpdate;
                });
                if (mustUpdate || this.languageServiceHost.getScriptContent(record.path) !== record.documentText) {
                    if (logger.warning()) {
                        if (mustUpdate) {
                            logger.log('TypeScriptProject: inconsistent change descriptor: ' + JSON.stringify(lastChange));
                        } else {
                            logger.log('TypeScriptProject: text different before and after change');
                        }
                    }
                    this.languageServiceHost.updateScript(record.path, record.documentText);
                }

                this.updateReferences(record.path, oldPaths);
            }
        });
    };
}


interface TypeScriptInfo {
    factory: Services.TypeScriptServicesFactory;
    libLocation: string;
}

module TypeScriptProject {
    /**
     * enum describing the type of file ib a project
     */
    export enum ProjectFileKind {
        /**
         * the file is not a part of the project
         */
        NONE,
        /**
         * the file is a source file of the project
         */
        SOURCE,
        /**
         * the file is referenced by a source file of the project
         */
        REFERENCE
    }
    
    
    /**
     * default Project factory
     * @param baseDirectory the baseDirectory of the project
     * @param config the project config file
     * @param fileSystem the fileSystem wrapper used by the project
     * @param workingSet the working set wrapper used by the project
     * @param defaultLibLocation the location of the default compiler 'lib.d.ts' file
     */
    export function newProject(
        baseDirectory: string,
        config: TypeScriptProjectConfig, 
        fileSystem: fs.IFileSystem,
        workingSet: ws.IWorkingSet,
        defaultLibLocation: string
    ) {
        return new TypeScriptProject(baseDirectory, config, fileSystem, workingSet, defaultLibLocation);
    }
}

export = TypeScriptProject;
