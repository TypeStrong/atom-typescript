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


import Promise = require('bluebird');
import path = require('path');
import PromiseQueue = require('../commons/promiseQueue');
import ws = require('../commons/workingSet');
import fs = require('../commons/fileSystem');
import TypeScriptPreferenceManager = require('../commons/preferencesManager');
import TypeScriptProjectConfig = require('../commons/projectConfig');
import collections = require('../commons/collections');
import tsUtils = require('../commons/typeScriptUtils');
import utils = require('../commons/utils');
import logger = require('../commons/logger');
import TypeScriptProject = require('./project');

//--------------------------------------------------------------------------
//
//  TypeScriptProjectManager
//
//--------------------------------------------------------------------------


/**
 * The main facade class of the extentions, responsible to create, destroy, update 
 * projects by observing preferenreces.
 */
class TypeScriptProjectManager {
    
    //-------------------------------
    //  variables
    //-------------------------------
    
    /**
     * preferences manager used to retrieve project config
     */
    private preferenceManager: TypeScriptPreferenceManager;
    
    /**
     * editor filesystem manager
     */
    private fileSystem: fs.IFileSystem;
    
    /**
     * editor workingSet manager
     */
    private workingSet: ws.IWorkingSet;
    
    /**
     * a factory used to create project
     */
    private projectFactory: TypeScriptProjectManager.ProjectFactory;
    
    /**
     * a map containing the projects 
     */
    private projectMap = new collections.StringMap<TypeScriptProject>();
    
    /**
     * tempory Project used for typescript file 
     * that correspond to no registred project
     */
    private tempProject: TypeScriptProject;
    
    /**
     * absolute path of the opened root directory 
     */
    private projectRootDir: string;
    
    /**
     * a promise queue used to insure async task are run sequentialy
     */
    private queue = new PromiseQueue();
    
    /**
     * location of the default typescript compiler lib.d.ts file
     */
    private defaultTypeScriptLocation: string;
    
    //-------------------------------
    // Public methods
    //------------------------------- 
    
    /**
     * initialize the project manager
     * 
     * @param defaultTypeScriptLocation location of the default typescript compiler lib.d.ts file
     * @param preferenceManager preferences manager used to retrieve project config
     * @param fileSystem editor filesystem manager
     * @param workingSet editor workingset manager 
     * @param projectFactory a factory used to create project
     */
    init(
        defaultTypeScriptLocation: string, 
        preferenceManager: TypeScriptPreferenceManager, 
        fileSystem: fs.IFileSystem,
        workingSet: ws.IWorkingSet, 
        projectFactory: TypeScriptProjectManager.ProjectFactory
    ): Promise<void> {
        
        this.defaultTypeScriptLocation = defaultTypeScriptLocation;
        this.preferenceManager = preferenceManager;
        this.workingSet = workingSet;
        this.fileSystem = fileSystem;
        this.projectFactory = projectFactory;
        
        this.preferenceManager.configChanged.add(this.configChangeHandler);
        
        return this.queue.init(
            this.fileSystem.getProjectRoot().then(projectRootDir => {
                this.projectRootDir = projectRootDir;
                return this.createProjects();
            })
        );
    }
    
    
    /**
     * dispose the project manager
     */
    dispose(): void {
        this.preferenceManager.configChanged.remove(this.configChangeHandler);
        this.queue.then(() => this.disposeProjects());
    }
    
    /**
     * this method will try to find a project referencing the given path
     * it will by priority try to retrive project that have that file as part of 'direct source'
     * before returning projects that just have 'reference' to this file
     * 
     * @param fileName the path of the typesrcript file for which project are looked fo
     */
    getProjectForFile(fileName: string): Promise<TypeScriptProject> {
        return this.queue.then((): any => {
            var projects = this.projectMap.values,
                project: TypeScriptProject = null;
            //first we check for a project that have tha file as source 
            projects.some(tsProject => {
                if (tsProject.getProjectFileKind(fileName) === TypeScriptProject.ProjectFileKind.SOURCE) {
                    project = tsProject;
                    return true;
                }
            });     

            
            //then we check if a project has a file referencing the given file
            if (!project) {
                projects.some(tsProject => {
                    if (tsProject.getProjectFileKind(fileName) === TypeScriptProject.ProjectFileKind.REFERENCE) {
                        project = tsProject;
                        return true;
                    }
                });     
            }

            //then we check if the current temp project has the file
            if (!project) {
                if (this.tempProject && this.tempProject.getProjectFilesSet().has(fileName)) {
                    project = this.tempProject;
                } else if (this.tempProject) {
                    this.tempProject.dispose();
                    this.tempProject = null;
                }
            }
            
            //then if still no project found we create the temp project
            if (!project) {
                var config: TypeScriptProjectConfig = utils.clone(tsUtils.typeScriptProjectConfigDefault);
                config.target = 'es5';
                config.sources = [fileName];
                this.tempProject = project = this.projectFactory(
                    this.projectRootDir, 
                    config,  
                    this.fileSystem, 
                    this.workingSet,
                    path.join(this.defaultTypeScriptLocation, 'lib.d.ts') 
                );
                return this.tempProject.init().then(() => this.tempProject);
            }
            
            return project;
        });
    }
    
    //-------------------------------
    //  Private methods
    //------------------------------- 
    
    /**
     * create projects from project configs retrieved by the preferenceManager
     */
    private createProjects(): Promise<any> {
        return this.preferenceManager.getProjectsConfig().then(configs => {
            return Promise.all(
                Object.keys(configs)
                    .map(projectId => this.createProjectFromConfig(projectId, configs[projectId]))
            );
        });
    }
    
    /**
     * dispose every projects created by the ProjectManager
     */
    private disposeProjects(): void {
        var projectMap = this.projectMap;
        projectMap.keys.forEach(path =>  {
            projectMap.get(path).dispose();
        });
        this.projectMap.clear();
        if (this.tempProject) {
            this.tempProject.dispose();
            this.tempProject = null;
        }
    }
    
   
    
    /**
     * for given config and projectId create a project
     * 
     * @param projectId the id of the project
     * @param config the project config
     */
    private createProjectFromConfig(projectId: string, config: TypeScriptProjectConfig) {
        var project = this.projectFactory(
            this.projectRootDir, 
            config,  
            this.fileSystem, 
            this.workingSet,
            path.join(this.defaultTypeScriptLocation, 'lib.d.ts') 
        );
        return project.init().then(() => {
            this.projectMap.set(projectId, project);
        }, () => {
            if (logger.fatal()) {
                logger.log('could not create project:' + projectId);
            }
        });
    }

    
    //-------------------------------
    //  Events Handler
    //------------------------------- 
    
    
    /**
     * handle changes in the preferences, update / delete / create project accordingly
     */
    private configChangeHandler = () => {
        this.queue.then(() => {
            this.preferenceManager.getProjectsConfig().then(configs => {
                var promises: Promise<any>[] = [];
                this.projectMap.entries.forEach(entry => {
                    var projectId = entry.key,
                        project = entry.value,
                        config = configs[projectId];
                    if (!config) {
                        project.dispose();
                        this.projectMap.delete(projectId);
                    } else {
                        promises.push(project.update(config));
                    } 
                });
                
                Object.keys(configs).forEach(projectId => {
                    if (!this.projectMap.has(projectId)) {
                        promises.push(this.createProjectFromConfig(projectId, configs[projectId]));
                    }
                });
            });
        });
    };
}

module TypeScriptProjectManager {
    /**
     * a factory used by the projectManager to create projects
     * @param baseDirectory the baseDirectory of the project
     * @param config the project config file
     * @param fileSystem the fileSystem wrapper used by the project
     * @param workingSet the working set wrapper used by the project
     * @param defaultLibLocation the location of the default compiler 'lib.d.ts' file
     */
    export interface ProjectFactory {
        (
            baseDirectory: string,
            config: TypeScriptProjectConfig, 
            fileSystem: fs.IFileSystem,
            workingSet: ws.IWorkingSet,
            defaultLibLocation: string
        ): TypeScriptProject
    }
}


export = TypeScriptProjectManager;
