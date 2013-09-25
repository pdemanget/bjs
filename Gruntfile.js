/**
 * Project           BJS
 * 
 * Compilation script usage: 
 *   grunt       : build all
 *   grunt clean : remove dist dir
 */

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        
        clean: {
            dist: ['dist']
        },

        // validate js files
        jshint: {
            options: {
                laxbreak: true
            },
            all: ['src/app/**/*.js']
        },
        // Less build
        less: {
            all: {
                options: {
                    yuicompress: false
                },
                files: {
                    'public/css/recueil.css': "src/less/recueil.less"
                }
            }
        },


        convert: {
            translation: {
                options: {
                    indent: 8
                },
                expand: true,
                cwd: 'src',
                src: ['locales/*.yml'],
                dest: 'public',
                ext: '.json'
            }
        },

        // Copy assets
        copy: {
            main: {
                files: [
                    {src: ['src/index.html'], dest: 'public/index.html'},
                ]
            }
        },

        // Concatenate assets and hs
        concat: {
            application: {
                src: ['src/app/**/*.js'],
                dest: 'dist/js/b.js'
            },


        },

        uglify: {
            application: {
                files: {
                    'dist/js/b.js': ['dist/js/b.js']
                }
            }
        },

        watch: {
            scripts: {
                files: ['src/**/*.js', 'src/**/*.less', 'src/**/*.css', 'src/**/*.html', 'src/**/*.png'],
                tasks: ['dev'],
                options: {
                    nospawn: true
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-convert');

    grunt.registerTask('default', ['jshint', 'clean', 'less', 'convert', 'copy', 'concat', 'uglify']);
};
