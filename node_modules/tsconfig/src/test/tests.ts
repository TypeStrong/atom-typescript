/// <reference path="../typings/vendor.d.ts"/>
/// <reference path="../lib/interfaces.d.ts"/>

import main = require('../lib/index');
import chai = require('chai');
import path = require('path');

var pathToTestProjects = path.normalize(path.join(__dirname, '../../testprojects/'));

describe(main.getProjectsSync.name,() => {

    var expectedProjectFileDetails: {
        testPath: string;
        expected: TypeScriptProjectFileDetails;
    }[] = [
            {
                testPath: pathToTestProjects + '/valid/simple/src/foo.ts',
                expected: {
                    projectFileDirectory: path.normalize(pathToTestProjects + '/valid/simple/'),
                    project: {
                        "compilerOptions": {
                            declaration: false,
                            "module": "commonjs",
                            "noImplicitAny": true,
                            "removeComments": true,
                            "preserveConstEnums": true,
                            "out": "../../built/local/tsc.js",
                            "sourceMap": true,
                            target:'es5'
                        },
                        "files": [
                            "./src/foo.ts"
                        ]
                    }
                }
            }
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
                expectedFailureMessage: 'Invalid JSON'
            },
        ];


    it('Expected results should match',() => {
        expectedProjectFileDetails.forEach((test) => {
            var result = main.getProjectsSync(test.testPath);
            chai.assert.deepEqual(result, test.expected);
        });
    });

    it('Fail gracefully',() => {
        failOnThese.forEach((test) => {
            chai.assert.throws(() => main.getProjectsSync(test.testPath), test.expectedFailureMessage);
        });
    });
});

import fs = require('fs');
describe(main.createProjectsRootSync.name,() => {

    it('should be able to create project if not there',() => {
        main.createProjectsRootSync(pathToTestProjects + '/create/new/foo.ts')
        fs.unlinkSync(pathToTestProjects + '/create/new/tsconfig.json')
    });

    it('should fail if existing project',() => {
        chai.assert.throws(() => main.createProjectsRootSync(pathToTestProjects + '/create/existing/foo.ts'), 'Project file already exists');
    });
});