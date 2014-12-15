/// <reference path="../typings/vendor.d.ts"/>
/// <reference path="../lib/interfaces.d.ts"/>

import main = require('../lib/index');
import chai = require('chai');
import path = require('path');

var pathToTestProjects = path.normalize(path.join(__dirname, '../../testprojects/'));

describe(main.getProjectsSync.name, () => {


    var expectedProjectFileDetails: {
        testPath: string;
        expected: TypeScriptProjectFileDetails;
    }[] = [
            {
                testPath: pathToTestProjects + '/valid/dual/src/foo.ts',
                expected: {
                    projectFileDirectory: path.normalize(pathToTestProjects + '/valid/dual/'),
                    projects: [
                        {
                            "name": "web",
                            "declaration": false,
                            "expandedSources": [
                                "./src/foo.ts",
                                "./webonly/bar.ts"
                            ],
                            "module": "amd",
                            "noImplicitAny": false,
                            "removeComments": true,
                            "sources": [
                                "./src/**/*.ts",
                                "./webonly/**/*.ts"
                            ],
                            sourceMap: false,
                            "target": "es5",
                        },
                        {
                            "name": "node",
                            "declaration": false,
                            "expandedSources": [
                                "./src/foo.ts"
                            ],
                            "module": "commonjs",
                            "noImplicitAny": false,
                            "removeComments": true,
                            "sources": [
                                "./src/**/*.ts",
                            ],
                            sourceMap: false,
                            "target": "es5"
                        }
                    ]
                }
            },
            {
                testPath: pathToTestProjects + '/valid/defaultsonly/src/foo.ts',
                expected: {
                    projectFileDirectory: path.normalize(pathToTestProjects + '/valid/defaultsonly/'),
                    projects: [
                        {
                            "name": "web",
                            "declaration": false,
                            "expandedSources": [
                                "./src/foo.ts",
                            ],
                            "module": "amd",
                            "noImplicitAny": false,
                            "removeComments": true,
                            "sources": [
                                "./src/**/*.ts",
                            ],
                            sourceMap: false,
                            "target": "es5",
                        },
                    ]
                }
            },
            {
                testPath: pathToTestProjects + '/valid/defaultsextended/src/foo.ts',
                expected: {
                    projectFileDirectory: path.normalize(pathToTestProjects + '/valid/defaultsextended/'),
                    projects: [
                        {
                            "name": "web",
                            "declaration": false,
                            "expandedSources": [
                                "./src/foo.ts",
                            ],
                            "module": "amd",
                            "noImplicitAny": false,
                            "removeComments": true,
                            "sources": [
                                "./src/**/*.ts",
                            ],
                            sourceMap: false,
                            "target": "es5",
                        },
                    ]
                }
            },
        ];

    var failOnThese: {
        testPath: string;
        expectedFailureMessage: string
    }[] = [
            {
                testPath: 'some/dumb/path',
                expectedFailureMessage: 'Invalid Path'
            },
            {
                testPath: pathToTestProjects + '/errors/noprojectfile/foo.ts',
                expectedFailureMessage: 'No Project Found'
            },
            {
                testPath: pathToTestProjects + '/errors/invalidfile',
                expectedFailureMessage: 'Invalid YAML'
            },
            {
                testPath: pathToTestProjects + '/errors/noprojects/src',
                expectedFailureMessage: "Project file must have a 'projects' section"
            },
        ];


    it('Expected results should match', () => {
        expectedProjectFileDetails.forEach((test) => {
            chai.assert.deepEqual(main.getProjectsSync(test.testPath), test.expected);
        });
    });

    it('Fail gracefully', () => {
        failOnThese.forEach((test) => {
            chai.assert.throws(() => main.getProjectsSync(test.testPath), test.expectedFailureMessage);
        });
    });
});


describe(main.getProjectsForFileSync.name, () => {
    var expectedProjectFileDetails: {
        testPath: string;
        expected: TypeScriptProjectFileDetails;
    }[] = [
            {
                testPath: pathToTestProjects + '/valid/dual/src/foo.ts',
                expected: {
                    projectFileDirectory: path.normalize(pathToTestProjects + '/valid/dual/'),
                    projects: [
                        {
                            "name": "web",
                            "declaration": false,
                            "expandedSources": [
                                "./src/foo.ts",
                                "./webonly/bar.ts"
                            ],
                            "module": "amd",
                            "noImplicitAny": false,
                            "removeComments": true,
                            "sources": [
                                "./src/**/*.ts",
                                "./webonly/**/*.ts"
                            ],
                            sourceMap: false,
                            "target": "es5",
                        },
                        {
                            "name": "node",
                            "declaration": false,
                            "expandedSources": [
                                "./src/foo.ts"
                            ],
                            "module": "commonjs",
                            "noImplicitAny": false,
                            "removeComments": true,
                            "sources": [
                                "./src/**/*.ts",
                            ],
                            sourceMap: false,
                            "target": "es5"
                        }
                    ]
                }
            },
            {
                testPath: pathToTestProjects + '/valid/dual/webonly/bar.ts',
                expected: {
                    projectFileDirectory: path.normalize(pathToTestProjects + '/valid/dual/'),
                    projects: [
                        {
                            "name": "web",
                            "declaration": false,
                            "expandedSources": [
                                "./src/foo.ts",
                                "./webonly/bar.ts"
                            ],
                            "module": "amd",
                            "noImplicitAny": false,
                            "removeComments": true,
                            "sources": [
                                "./src/**/*.ts",
                                "./webonly/**/*.ts"
                            ],
                            sourceMap: false,
                            "target": "es5",
                        }
                    ]
                }
            }
        ];

    it('Expected results should match', () => {
        expectedProjectFileDetails.forEach((test) => {
            chai.assert.deepEqual(main.getProjectsForFileSync(test.testPath), test.expected);
        });
    });

});

import fs = require('fs');
describe(main.createProjectsRootSync.name, () => {
    
    it('should be able to create project if not there', () => {
        main.createProjectsRootSync(pathToTestProjects + '/create/new/foo.ts')
        fs.unlinkSync(pathToTestProjects + '/create/new/tsproj.yml')
    });

    it('should fail if existing project', () => {
        chai.assert.throws(() => main.createProjectsRootSync(pathToTestProjects + '/create/existing/foo.ts'), 'Project file already exists');
    });
});