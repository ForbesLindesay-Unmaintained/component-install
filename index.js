var remote = 'https://raw.github.com';

var Q = require('q');
var join = require('path').join;
var write = Q.nfbind(require('fs').writeFile);
var read = Q.nfbind(require('fs').readFile);
var mkdirp = require('mkdirp');
var download = require('./lib/download-file');

module.exports = install;
function install(directory, dev, out, callback) {
  if (typeof out === 'function') {
    callback = out;
    out = join(directory, 'components');
  }
  return read(join(directory, 'component.json'))
    .then(function (data) {
      try {
        data = JSON.parse(data);
      } catch (ex) {
        err.message += ' in component.json';
        throw err;
      }
      return installDependencies(data, out, dev || false, {}).nodeify(callback);
    })
}

function url(name, version, file) {
  if (version === '*') version = 'master';
  return remote + '/' + name + '/' + (version || 'master') + '/' + file;
}

function installDependency(name, version, destination, cache) {
  return Q.all([download(url(name, version, 'component.json'), {json: true}), mkdirp(join(destination, name.split('/').join('-')))])
    .spread(function (config) {
      config.repo = config.repo || remote + '/' + name;
      return Q.all([
        installDependencies(config, destination, false, cache),
        downloadFiles(name, version, config, join(destination,name.split('/').join('-'))),
        write(join(destination, name.split('/').join('-'), 'component.json'), JSON.stringify(config, null, 2))
      ]);
    });
}

function downloadFiles(name, version, config, destination) {
  var files = [];
  if (config.scripts) files = files.concat(config.scripts);
  if (config.styles) files = files.concat(config.styles);
  if (config.templates) files = files.concat(config.templates);
  if (config.files) files = files.concat(config.files);
  if (config.images) files = files.concat(config.images);
  if (config.fonts) files = files.concat(config.fonts);
  return Q.all(files.map(function (file) {
    return download(url(name, version, file), {destination: join(destination, file)});
  }))
}
function installDependencies(config, destination, dev, cache) {
  var dependencies = [];
  if (config.dependencies) dependencies = normalize(config.dependencies);
  if (dev && config.development) dependencies = dependencies.concat(normalize(config.development));
  return Q.all(dependencies.map(function (dep) {
    if (cache['dep: ' + dep]) return;
    else cache['dep: ' + dep] = true;
    return installDependency(dep[0], dep[1], destination, cache);
  }));
}

function normalize(deps) {
  return Object.keys(deps).map(function(name){
    return [name, deps[name]];
  });
}
