module.exports = function (grunt) {
    'use strict';

    var srcDir = 'lib';

    grunt.initConfig({
        ts: {
            options: {
                target: 'es5',
                module: 'commonjs',
                sourceMap: false,
                preserveConstEnums: true,
                compiler: './node_modules/ntypescript/bin/tsc'
            },
            dev: {
                src: [srcDir + '/**/*.ts'],
                watch: srcDir,
                outDir: './dist/',
                baseDir: './lib/'
            },
            build: {
                src: [srcDir + '/**/*.ts'],
                outDir: './dist/',
                baseDir: './lib/'
            },
        },
    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.registerTask('default', ['ts:dev']);
    grunt.registerTask('build', ['ts:build']);
};
