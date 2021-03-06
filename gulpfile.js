﻿var config = require('./config.json');
var gulp = require('gulp-help')(require('gulp'));
var simssh = require('simple-ssh');
var helper = require('az-iot-helper');
var Q = require('q');
var runSequence = require('run-sequence');
var args = require('get-gulp-args')();

gulp.task('install-tools', 'Installs required software on Raspberry Pi', function (cb) {
  helper.azhSshExec('sudo apt-get -y update && sudo apt-get -y install npm', config, args.verbose, cb);
});

gulp.task('deploy', 'Deploys sample code to the board', function(){
  var deferred = Q.defer();
  
  var targetFolder = config.project_folder ? config.project_folder : '.';
  helper.uploadFilesViaScp(config, ["./blink.js", "./device-package.json"], [targetFolder + "/blink.js", targetFolder + "/package.json"], function(){
    console.log("- Installing npm packages on device");
    
    var ssh = new simssh({
      host: config.device_host_name_or_ip_address,
      user: config.device_user_name,
      pass: config.device_password
    });

    ssh.on('error', function (e) {
      // when we pass error via deferred.reject, stack will be displayed
      // as it is just string, we can just replace it with message
      e.stack = "ERROR: " + e.message;
      deferred.reject(e);
    });

    ssh.exec('cd ' + targetFolder + ' && npm install', {
      pty: true,
      out: function (o) { if (args.verbose) console.log(o); },
      exit: function() { deferred.resolve(); }
    }).start();
  });
  
  return deferred.promise;
});

gulp.task('run', 'Runs deployed sample on the board', function () {
  var deferred = Q.defer();

  var ssh = new simssh({
    host: config.device_host_name_or_ip_address,
    user: config.device_user_name,
    pass: config.device_password
  });

  ssh.on('error', function (e) {
    // when we pass error via deferred.reject, stack will be displayed
    // as it is just string, we can just replace it with message
    e.stack = "ERROR: " + e.message;
    deferred.reject(e);
  });

  var targetFolder = config.project_folder ? config.project_folder : '.';
  var startFile = config.start_file ? config.start_file : 'blink.js';
  ssh.exec('sudo nodejs ' + targetFolder + '/' + startFile + ' && exit', {
    pty: true,
    out: console.log.bind(console),
    exit: function() { deferred.resolve(); }
  }).start();

  return deferred.promise;
});

gulp.task('default', 'Builds, deploys and runs sample on the board', function(callback) {
  runSequence('install-tools', 'deploy', 'run', callback);
})