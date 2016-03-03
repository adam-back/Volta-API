module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jasmine_node: {
      task_name: {
        options: {
          coverage: {},
          forceExit: false,
          showColors: true,
          match: '.',
          matchAll: false,
          specFolders: [ 'test' ],
          extensions: 'js',
          specNameMatcher: 'spec',
          captureExceptions: false,
          junitreport: {
            report: false,
            savePath : './build/reports/jasmine/',
            useDotNotation: true,
            consolidate: true
          }
        },
        src: [ '*.js', 'controllers/**/*.js', 'routes/**/*.js', 'factories/*.js', 'factories/**/*.js']
      }
    },
    watch: {
      files: [ '*.js', 'controllers/**/*.js', 'factories/**/*.js', 'test/**/*.spec.js' ],
      tasks: 'test'
    }
  });

  grunt.loadNpmTasks('grunt-jasmine-node-coverage');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', 'watch');
  grunt.registerTask('test', 'jasmine_node');
};