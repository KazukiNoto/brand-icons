'use strict';

module.exports = function(grunt) {
  var path = require('path');
  var fs = require('fs');

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    config: grunt.file.readJSON('config.json'),
    banner: '/* <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.

    // -- Clean Config ---------------------------------------------------------
    clean: {
      build: ['<%=config.destination.font%>','<%=config.destination.css%>','<%=config.destination.html%>/<%=config.name%>.html'],
      rename:['src/**/icons_*.svg'],
      prepare: ['<%=config.source%>']
    },
    
    // -- Concat Config ---------------------------------------------------------
    concat: {
      options: {
        banner: '<%= banner %>',
        stripBanners: true
      }
    },

    // -- banner Config ----------------------------------------------------------
    usebanner: {
      dist: {
        options: {
          position: 'top',
          banner: '<%= banner %>',
          linebreak: false
        },
        expand: true,
        cwd: '<%=config.destination.css%>',
        src: [ '**/*.less', '**/*.css' ]
      }
    },

    // -- copy Config ----------------------------------------------------------
    copy: {
      rename: {
        expand: true,
        cwd: '<%=config.raw_source%>/',
        src: ['**/*.svg'],
        dest: '<%=config.raw_source%>/',
        rename: function (path, name) {
          return path + name.replace(/icons_/g,"");
        }
      },
    },

    // -- svgmin Config ----------------------------------------------------------
    svgmin: {
      options: {
          plugins: [
            { removeViewBox: false },
            { removeUselessStrokeAndFill: false },
            { convertPathData: false }
          ]
      },
      dist: {
          files: [{
              expand: true,
              cwd: '<%=config.source%>',
              src: ['**/*.svg'],
              dest: '<%=config.source%>',
              ext: '.svg'
          }]
      }
    },

    // -- prepareicons Config ----------------------------------------------------------
    prepareicons: {
      src: {
        options: {
          icons: 'icons.json',
          dest: '<%=config.source%>',
        },
        expand: true,
        cwd: '<%=config.raw_source%>',
        src: ['**/*.svg'],
        dest: '<%=config.source%>'
      }
    },

    // -- webfont Config ----------------------------------------------------------
    webfont: {
      css: {
        options: {
          syntax: 'bootstrap',
          stylesheet: 'css',
          font: '<%=config.name%>',
          htmlDemo: true,
          destHtml: '<%=config.destination.html%>',
          autoHint: true,
          relativeFontPath: '../fonts',
          hashes: false,
          htmlDemoTemplate: '<%=config.templates.html%>',
          template: '<%=config.templates.css%>',
          templateOptions: {
              "baseClass": '<%=config.css_options.baseClass%>',
              "classPrefix": '<%=config.css_options.classPrefix%>',
              "mixinPrefix": '<%=config.css_options.mixinPrefix%>'
          },
          rename: function(name) {
            return path.basename(name).replace(/^\d*-/, '');
          }
        },
        expand: true,
        cwd: '<%=config.source%>',
        src: ['**/*.svg'],
        dest: '<%=config.destination.font%>',
        destCss: '<%=config.destination.css%>'
      },
      less: {
        options: {
          syntax: 'bootstrap',
          stylesheet: 'less',
          font: '<%=config.name%>',
          htmlDemo: true,
          destHtml: '<%=config.destination.html%>',
          autoHint: true,
          relativeFontPath: '../fonts',
          hashes: false,
          htmlDemoTemplate: '<%=config.templates.html%>',
          template: '<%=config.templates.css%>',

          templateOptions: {
              "fontfaceStyles": false,
              "baseClass": '<%=config.css_options.baseClass%>',
              "classPrefix": '<%=config.css_options.classPrefix%>',
              "mixinPrefix": '<%=config.css_options.mixinPrefix%>'
          },
          rename: function(name) {
            return path.basename(name).replace(/^\d*-/, '');
          }
        },
        expand: true,
        cwd: '<%=config.source%>',
        src: ['**/*.svg'],
        dest: '<%=config.destination.font%>',
        destCss: '<%=config.destination.css%>'
      }
    }
  });

  grunt.registerMultiTask('prepareicons', 'Prepare icons', function() {
      var options = this.options({
          icons: {}
      });

      if(typeof options.icons === 'string') {
        options.icons = grunt.file.readJSON(options.icons);
      }

      var count = 1;
      var icons = {};
      for(var icon in options.icons) {
        if(options.icons[icon] === true){
          icons[icon] = count;
          count ++;
        }
      }

      var dir = options.dest;
      grunt.file.mkdir(dir);

      this.files.forEach(function (f) {
        var dest = f.dest;
  //var dir = path.dirname(dest);

        f.src.filter(function (file) {
          var slug = path.basename(file, '.svg');

          if(icons.hasOwnProperty(slug) === false){
            grunt.file.delete(file);
          } else {
            //grunt.file.mkdir(dir);
            var order = icons[slug].toString();
            if(order.length === 1){
              order = '00'+order;
            }
            if(order.length === 2){
              order = '0'+order;
            }
            dest = path.join(dir, order +'-'+slug+'.svg');

            grunt.file.copy(file, dest);
          }
        });
      });
      count = count -1;
      grunt.log.write('✔'.green + ' ' + count + ' icons prepared');
      grunt.log.writeln();
  });

  // Load npm plugins to provide necessary tasks.
  require('load-grunt-tasks')(grunt, {
    pattern: ['grunt-*']
  });

  // Default task.
  grunt.registerTask('rename', ['copy:rename', 'clean:rename']);

  grunt.registerTask('default', ['prepare', 'build']);

  grunt.registerTask('build', ['clean:build','webfont','usebanner']);

  grunt.registerTask('prepare', ['clean:prepare', 'prepareicons', 'svgmin']);
};
