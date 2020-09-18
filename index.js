const s3ls = require("s3-ls");

const trimEnd = (s, ch) =>
  s[s.length - 1] === ch ? trimEnd(s.substr(0, s.length - 1), ch) : s;

const toSafeDepth = n => {
  n = Number(n);
  n = Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
  return n >= 0 ? n : Number.MAX_SAFE_INTEGER;
};

function getLastPathPart(path) {
  path = trimEnd(path, "/");
  const lastIndex = path.lastIndexOf("/");
  return path.substr(lastIndex + 1);
}

module.exports = function(options) {
  const lister = s3ls(options);

  async function generate(folder, depth) {
    depth = toSafeDepth(depth);

    let data = await lister.ls(folder);

    const tree = {};
    data.files.forEach(file => {
      tree[getLastPathPart(file)] = file;
    });

    if (data.folders && data.folders.length) {
      await Promise.all(
        data.folders.map(async path => {
          tree[getLastPathPart(path)] =
            depth > 0 ? await generate(path, depth - 1) : {};
        })
      );
    }
    return tree;
  }

  return { generate };
};
