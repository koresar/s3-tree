const s3ls = require("s3-ls");

const trimEnd = (s, ch) =>
  s[s.length - 1] === ch ? trimEnd(s.substr(0, s.length - 1), ch) : s;

function getLastPathPart(path) {
  path = trimEnd(path, "/");
  const lastIndex = path.lastIndexOf("/");
  return path.substr(lastIndex + 1);
}

module.exports = function(options) {
  const lister = s3ls(options);

  function generate(folder, depth) {
    return lister.ls(folder).then(data => {
      const tree = {};
      data.files.forEach(file => {
        tree[getLastPathPart(file)] = file;
      });

      if (!data.folders || !data.folders.length || depth === 0) return Promise.resolve(tree);

      const reducedDepth = (typeof depth === 'number' && depth > 0) ? depth - 1 : depth;

      return Promise.all(
        data.folders.map(path =>
          generate(path, reducedDepth).then(result => {
            tree[getLastPathPart(path)] = result;
          })
        )
      ).then(() => tree);
    });
  }

  return { generate };
};
