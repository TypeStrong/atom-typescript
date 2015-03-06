var sh = require('shelljs');
var os = require('os');
var fs = require('fs');

module.exports = {
  install: function(callback) {
    if(!callback) callback = function(){};
    getPackageDependencies(function(packs){
      var count = 0;
      var packLength = Object.keys(packs || {}).length;
      var counter = function(){
          count++;
          if(count == packLength){
              callback();
          }
      };
      if(!packLength) { callback(); }
      for (var p in packs){
        checkInstalled(p,counter);
      }
    });
  },
  require: function (pack) {
    var p = getPackagePath(pack);
    if(p && p.mainModulePath) return require(p.mainModulePath);
    console.log('Error: cannot find Atom package ' + pack);
  }
}

function isApmInstalled(){
  //TODO: replace with native node 'child_process' code
  if(!sh.which('apm')) {
    console.log('Please make sure apm is installed and in your PATH.');
    sh.exit(1);
  }
  else{
    return true;
  }
}

function checkInstalled(pack, callback){
  //checks if a package is installed. If not, it installs it
  var apm = getApmPath();
  var searchString = '^' + pack + '@';
  var cmdString = apm + ' ls -b';
  doExternalCommand(cmdString, function(code, output){
    grepAsync(searchString, output, function(result){
      if(!result){
        console.log(pack + ' not installed. Attempting installation now.');
        installPack(pack, callback);
      }
      else{
        console.log(pack + ' is already installed.');
        process.nextTick(callback);
      }
    })
  });
}

function installPack(pack, callback){
  //install package from apm registry
  var apm = getApmPath();
  var cmdString = apm + ' --color false install ' + pack;
  doExternalCommand(cmdString, function(code, output){
    if(!code){
      console.log(pack + ' installed successfully.');
      callback();
    }
    else{
      console.log(pack + ' install failed. Output: \n' + output);
      callback();
    }
  });
}

function getPackageJSONpath(callback){
  //returns path to 'package.json' in the Atom package that this is required by
  var findPkg = require('witwip');
  findPkg(module.parent, function(err, pkgPath, pkgData) {
    var path = pkgPath;
    callback(path);
  });
}

function getPackageDependencies(callback){
  //finds package that is dependant on this package, then parses JSON and gets 'package-dependencies'
  getPackageJSONpath(function(path){
    packages = JSON.parse(fs.readFileSync(path, 'utf8'));
    callback(packages['package-dependencies']);
  });
}

function getApmPath(){
  return atom.packages.getApmPath();
}

function getPackagePath(pack){
  return atom.packages.getLoadedPackage(pack);
}

function grepAsync(regex, text, callback){
  var tmp = require('tmp');
  tmp.tmpName(function _tempNameGenerated(err, path) {
    if (err) throw err;
    fs.writeFileSync(path, text);
    var result = sh.grep(regex, path);
    callback(result);
  });
}


function consoleOut(code, output){
  //use as callback function to doCommand() to get output
  if(code){
    console.log('Error. Exited with code ' + code + '\nOutput: ' + output);
  }
  else{
    console.log(output);
  }
}

function doExternalCommand(commandString, callback){
  if(!callback) callback = consoleOut;
  sh.exec(commandString, {silent:true}, callback);
}
