var main = require('../lib/index');
var chai = require('chai');
var path = require('path');
var pathToTestProjects = path.normalize(path.join(__dirname, '../../testprojects/'));
describe(main.getProjectsSync.name, function () {
    var expectedProjectFileDetails = [
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
                        target: 'es5'
                    },
                    "files": [
                        "./src/foo.ts"
                    ]
                }
            }
        }
    ];
    var failOnThese = [
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
    it('Expected results should match', function () {
        expectedProjectFileDetails.forEach(function (test) {
            var result = main.getProjectsSync(test.testPath);
            chai.assert.deepEqual(result, test.expected);
        });
    });
    it('Fail gracefully', function () {
        failOnThese.forEach(function (test) {
            chai.assert.throws(function () { return main.getProjectsSync(test.testPath); }, test.expectedFailureMessage);
        });
    });
});
var fs = require('fs');
describe(main.createProjectsRootSync.name, function () {
    it('should be able to create project if not there', function () {
        main.createProjectsRootSync(pathToTestProjects + '/create/new/foo.ts');
        fs.unlinkSync(pathToTestProjects + '/create/new/tsconfig.json');
    });
    it('should fail if existing project', function () {
        chai.assert.throws(function () { return main.createProjectsRootSync(pathToTestProjects + '/create/existing/foo.ts'); }, 'Project file already exists');
    });
});
