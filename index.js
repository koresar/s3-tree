var _ = require('lodash');
var async = require('async');
var s3ls = require('s3-ls');

function getLastPathPart(path) {
  return _.last(_.split(_.trim(path, '/'), '/'));
}

module.exports = function (options) {
  var lister = s3ls(options);

  function generate(folder, callback) {
    lister.ls(folder, function (error, data) {
      if (error) return callback(error);

      var tree = {};
      data.files.forEach(function (file) {
        tree[getLastPathPart(file)] = file;
      });

      if (_.isEmpty(data.folders)) return callback(null, tree);

      var tasks = {};
      data.folders.forEach(function (path) {
        tasks[getLastPathPart(path)] = generate.bind(null, path);
      });
      async.parallel(tasks, function (error, results) {
        if (error) return callback(error);
        callback(null, _.assign(tree, results));
      })
    });
  }

  return {
    generate: generate
  };
};
