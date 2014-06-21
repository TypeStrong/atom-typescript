module.exports = function (grunt) {
    'use strict';

    // Change this
    var srcDir = 'lib';

    grunt.initConfig({
        ts: {
            options: {
                target: 'es5',
                module: 'commonjs',
                sourceMap: false,
            },
            dev: {
                src: [srcDir + '/**/*.ts'],
                watch: srcDir
            },
            build: {
                src: [srcDir + '/**/*.ts'],
            },
        },
    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.registerTask('default', ['ts:dev']);
    grunt.registerTask('build', ['ts:build']);
};