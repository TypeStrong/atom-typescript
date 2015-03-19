///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

import ts = require('typescript');
import path = require('path');
import fs = require('fs');
import os = require('os');

export import languageServiceHost = require('./languageServiceHost2');
import tsconfig = require('../tsconfig/tsconfig');
import utils = require('./utils');

export class Project {
    public languageServiceHost: languageServiceHost.LanguageServiceHost;
    public languageService: ts.LanguageService;

    constructor(public projectFile: tsconfig.TypeScriptProjectFileDetails) {
        this.languageServiceHost = new languageServiceHost.LanguageServiceHost(projectFile);
        this.languageService = ts.createLanguageService(this.languageServiceHost, ts.createDocumentRegistry());
    }
}
