var test = require('tape');
var proxyquire = require('proxyquire');
var Promise = require('bluebird');

test('should throw if bucket name was not provided', function (t) {
  var s3tree = require('..');
  t.throws(s3tree);
  t.throws(s3tree.bind({}));
  t.throws(s3tree.bind({bucket: 123}));
  t.end();
});

test('should use s3-ls', function (t) {
  var s3 = {};
  var s3tree = proxyquire('..', {
    's3-ls': function s3ls(options) {
      t.equal(options.bucket, 'b');
      t.equal(options.s3, s3);
      t.end();
    }
  });

  s3tree({bucket: 'b', s3: s3})
});

test('should pass proper argument to the s3-ls', function (t) {
  t.plan(1);
  var s3tree = proxyquire('..', {
    's3-ls': function s3ls() {
      return {
        ls: function (path) {
          t.equal(path, '/');
          return Promise.resolve({files: [], folders: []});
        }
      };
    }
  });

  s3tree().generate('/').catch(t.end);
});

test('should generate tree of files', function (t) {
  t.plan(2);
  var s3tree = proxyquire('..', {
    's3-ls': function s3ls() {
      return {
        ls: function (path) {
          t.equal(path, '/');
          return Promise.resolve({files: ['file1', 'file2'], folders: []});
        }
      };
    }
  });

  s3tree().generate('/')
  .then(function (tree) {
    t.deepEqual(tree, {
      file1: 'file1',
      file2: 'file2'
    });
  })
  .catch(t.end);
});

test('should generate tree of folders and objects', function (t) {
  t.plan(5);
  var counter = 0;
  var s3tree = proxyquire('..', {
    's3-ls': function s3ls() {
      return {
        ls: function (path) {
          counter++;
          if (counter === 4) {
            t.equal(path, 'folder/sub-folder/sub-sub-folder/');
            return Promise.resolve({
              files: ['folder/sub-folder/sub-sub-folder/file7', 'folder/sub-folder/sub-sub-folder/file8'],
              folders: []
            });
          }

          if (counter === 3) {
            t.equal(path, 'folder/sub-folder/');
            return Promise.resolve({
              files: ['folder/sub-folder/file5', 'folder/sub-folder/file6'],
              folders: ['folder/sub-folder/sub-sub-folder/']
            });
          }

          if (counter === 2) {
            t.equal(path, 'folder/');
            return Promise.resolve({
              files: ['folder/file3', 'folder/file4'],
              folders: ['folder/sub-folder/']
            });
          }

          t.equal(path, '/');
          return Promise.resolve({
            files: ['file1', 'file2'],
            folders: ['folder/']
          });
        }
      };
    }
  });

  s3tree().generate('/')
  .then(function (tree) {
    t.deepEqual(tree, {
      file1: 'file1',
      file2: 'file2',
      folder: {
        file3: 'folder/file3',
        file4: 'folder/file4',
        'sub-folder': {
          file5: 'folder/sub-folder/file5',
          file6: 'folder/sub-folder/file6',
          'sub-sub-folder': {
            file7: 'folder/sub-folder/sub-sub-folder/file7',
            file8: 'folder/sub-folder/sub-sub-folder/file8'
          }
        }
      }
    });
  })
  .catch(t.end);
});
