const test = require("tape");
const proxyquire = require("proxyquire");

test("should throw if bucket name was not provided", t => {
  const s3tree = require("..");
  t.throws(s3tree);
  t.throws(s3tree.bind({}));
  t.throws(s3tree.bind({ bucket: 123 }));
  t.end();
});

test("should use s3-ls", t => {
  const s3 = {};
  const s3tree = proxyquire("..", {
    "s3-ls": function s3ls(options) {
      t.equal(options.bucket, "b");
      t.equal(options.s3, s3);
      t.end();
    }
  });

  s3tree({ bucket: "b", s3: s3 });
});

test("should pass proper argument to the s3-ls", t => {
  t.plan(1);
  const s3tree = proxyquire("..", {
    "s3-ls": function s3ls() {
      return {
        ls(path) {
          t.equal(path, "/");
          return Promise.resolve({ files: [], folders: [] });
        }
      };
    }
  });

  s3tree()
    .generate("/")
    .catch(t.end);
});

test("should generate tree of files", t => {
  t.plan(2);
  const s3tree = proxyquire("..", {
    "s3-ls": function s3ls() {
      return {
        ls(path) {
          t.equal(path, "/");
          return Promise.resolve({ files: ["file1", "file2"], folders: [] });
        }
      };
    }
  });

  s3tree()
    .generate("/")
    .then(tree => {
      t.deepEqual(tree, {
        file1: "file1",
        file2: "file2"
      });
    })
    .catch(t.end);
});

test("should generate tree of folders and objects", t => {
  t.plan(5);
  let counter = 0;
  const s3tree = proxyquire("..", {
    "s3-ls": function s3ls() {
      return {
        ls(path) {
          counter++;
          if (counter === 4) {
            t.equal(path, "folder/sub-folder/sub-sub-folder/");
            return Promise.resolve({
              files: [
                "folder/sub-folder/sub-sub-folder/file7",
                "folder/sub-folder/sub-sub-folder/file8"
              ],
              folders: []
            });
          }

          if (counter === 3) {
            t.equal(path, "folder/sub-folder/");
            return Promise.resolve({
              files: ["folder/sub-folder/file5", "folder/sub-folder/file6"],
              folders: ["folder/sub-folder/sub-sub-folder/"]
            });
          }

          if (counter === 2) {
            t.equal(path, "folder/");
            return Promise.resolve({
              files: ["folder/file3", "folder/file4"],
              folders: ["folder/sub-folder/"]
            });
          }

          t.equal(path, "/");
          return Promise.resolve({
            files: ["file1", "file2"],
            folders: ["folder/"]
          });
        }
      };
    }
  });

  s3tree()
    .generate("/")
    .then(tree => {
      t.deepEqual(tree, {
        file1: "file1",
        file2: "file2",
        folder: {
          file3: "folder/file3",
          file4: "folder/file4",
          "sub-folder": {
            file5: "folder/sub-folder/file5",
            file6: "folder/sub-folder/file6",
            "sub-sub-folder": {
              file7: "folder/sub-folder/sub-sub-folder/file7",
              file8: "folder/sub-folder/sub-sub-folder/file8"
            }
          }
        }
      });
    })
    .catch(t.end);
});

test("should accept depth as an optional argument for generate", t => {
  const getProxyQuire = (st) => {
    let counter = 0;
    return proxyquire("..", {
      "s3-ls": function s3ls() {
        return {
          ls(path) {
            counter++;
            if (counter === 4) {
              st.equal(path, "folder/sub-folder/sub-sub-folder/");
              return Promise.resolve({
                files: [
                  "folder/sub-folder/sub-sub-folder/file7",
                  "folder/sub-folder/sub-sub-folder/file8"
                ],
                folders: []
              });
            }

            if (counter === 3) {
              st.equal(path, "folder/sub-folder/");
              return Promise.resolve({
                files: ["folder/sub-folder/file5", "folder/sub-folder/file6"],
                folders: ["folder/sub-folder/sub-sub-folder/"]
              });
            }

            if (counter === 2) {
              st.equal(path, "folder/");
              return Promise.resolve({
                files: ["folder/file3", "folder/file4"],
                folders: ["folder/sub-folder/"]
              });
            }

            st.equal(path, "/");
            return Promise.resolve({
              files: ["file1", "file2"],
              folders: ["folder/"]
            });
          }
        };
      }
    });
  }

  t.test("should handle depth of 0", st => {
    st.plan(2);
    const s3tree = getProxyQuire(st);

    s3tree()
      .generate("/", 0)
      .then(tree => {
        st.deepEqual(tree, {
          file1: "file1",
          file2: "file2",
          folder: {}
        });
      })
      .catch(st.end);
  });

  t.test("should handle small positive depth", st => {
    st.plan(4);
    const s3tree = getProxyQuire(st);

    s3tree()
      .generate("/", 2)
      .then(tree => {
        st.deepEqual(tree, {
          file1: "file1",
          file2: "file2",
          folder: {
            file3: "folder/file3",
            file4: "folder/file4",
            "sub-folder": {
              file5: "folder/sub-folder/file5",
              file6: "folder/sub-folder/file6",
              "sub-sub-folder": {}
            }
          }
      });
      })
      .catch(st.end);
  });

  t.test("should handle large positive depth", st => {
    st.plan(5);
    const s3tree = getProxyQuire(st);

    s3tree()
    .generate("/", 100)
    .then(tree => {
      st.deepEqual(tree, {
        file1: "file1",
        file2: "file2",
        folder: {
          file3: "folder/file3",
          file4: "folder/file4",
          "sub-folder": {
            file5: "folder/sub-folder/file5",
            file6: "folder/sub-folder/file6",
            "sub-sub-folder": {
              file7: "folder/sub-folder/sub-sub-folder/file7",
              file8: "folder/sub-folder/sub-sub-folder/file8"
            }
          }
        }
      });
    })
    .catch(st.end);
  });

  t.test("should ignore if depth is negative", st => {
    st.plan(5);
    const s3tree = getProxyQuire(st);

    s3tree()
    .generate("/", -1)
    .then(tree => {
      st.deepEqual(tree, {
        file1: "file1",
        file2: "file2",
        folder: {
          file3: "folder/file3",
          file4: "folder/file4",
          "sub-folder": {
            file5: "folder/sub-folder/file5",
            file6: "folder/sub-folder/file6",
            "sub-sub-folder": {
              file7: "folder/sub-folder/sub-sub-folder/file7",
              file8: "folder/sub-folder/sub-sub-folder/file8"
            }
          }
        }
      });
    })
    .catch(st.end);
  });
});