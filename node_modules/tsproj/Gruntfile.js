module.exports = function (grunt) {
    'use strict';

    var srcDir = 'src';
    var outDir = 'dist';

    grunt.initConfig({
        ts: {
            options: {
                target: 'es5',
                module: 'commonjs',
                sourceMap: false,
                declaration: true,
            },
            dev: {
                src: [srcDir + '/**/*.ts'],
                outDir: outDir,
                watch: srcDir
            },
            build: {
                src: [srcDir + '/**/*.ts'],
                outDir: outDir,
            },
        },
        dts_bundle: {
            build: {

                options: {
                    name: 'tsproj',
                    main: './dist/lib/index.d.ts'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-dts-bundle');
    grunt.registerTask('default', ['ts:dev']);
    grunt.registerTask('build', ['ts:build', 'dts_bundle:build']);
};