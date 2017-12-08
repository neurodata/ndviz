module.exports = function(grunt) {
  "use strict";

  grunt.initConfig({
    copy: {
      build: {
        files: [
          {
            expand: true,
            cwd: "./build" + "/" + (grunt.option('env') || "dev"),
            src: ["*.js", "*.js.map", "*.css", "*.css.map"],
            dest: "./dist/public/"
          },
          {
            expand: true,
            cwd: "./build" + "/" + (grunt.option('env') || "dev"),        src: ["*.html"],
            dest: "./dist/views"
          },
          {
            expand: true, 
            cwd: "./static",
            src: ["**"],
            dest: "./dist/public/static/"
          }
        ]
      }
    },
    ts: {
      app: {
        files: [{
          src: ["server/\*\*/\*.ts", "!src/.baseDir.ts"],
          dest: "./dist"
        }],
        options: {
          module: "commonjs",
          target: "es6",
          sourceMap: false
        }
      }
    },
    watch: {
      ts: {
        files: ["server/\*\*/\*.ts"],
        tasks: ["ts"]
      },
      views: {
        files: ["./build" + "/" + (grunt.option('env') || "dev") + "/**"],
        tasks: ["copy"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-ts");

  grunt.registerTask("default", [
    "copy",
    "ts"
  ]);

};