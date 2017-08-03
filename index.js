var _ = require('lodash');
var s3ls = require('s3-ls');

function getLastPathPart(path) {
  return _.last(_.split(_.trim(path, '/'), '/'));
}

module.exports = function (options) {
  var lister = s3ls(options);

  function generate(folder) {
    return lister.ls(folder)
    .then(function (data) {
      var tree = {};
      data.files.forEach(function (file) {
        tree[getLastPathPart(file)] = file;
      });

      if (_.isEmpty(data.folders)) return Promise.resolve(tree);

      return Promise.all(data.folders.map(function (path) {
        return generate(path).then(function (result) {
          tree[getLastPathPart(path)] = result;
        });
      }))
      .then(function () { return tree; });
    });
  }

  return {
    generate: generate
  };
};
