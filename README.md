# s3-tree [![Build Status](https://travis-ci.org/koresar/s3-tree.svg?branch=master)](https://travis-ci.org/koresar/s3-tree)
Generates a tree of an S3 bucket contents

WARNING! The number of HTTP calls are not optimized. Does a request per 'folder'.

# Install
```sh
npm i -S s3-tree
```

# Usage
```js
var s3tree = require('s3-tree');

var generator = s3tree({bucket: 'my-bucket-name'});

generator.generate('/my-folder/subfolder/', function (error, tree) {
  console.log(JSON.stringify(tree, null, 2));
});
```

Will log something like:
```
{
  "file1": "my-folder/subfolder/file1",
  "file2": "my-folder/subfolder/file2",
  "folder": {
    "file3": "my-folder/subfolder/folder/file3",
    "file4": "my-folder/subfolder/folder/file4",
    "sub-folder": {
      "file5": "my-folder/subfolder/folder/sub-folder/file5",
      "file6": "my-folder/subfolder/folder/sub-folder/file6",
      "sub-sub-folder": {
        "file7": "my-folder/subfolder/folder/sub-folder/sub-sub-folder/file7",
        "file8": "my-folder/subfolder/folder/sub-folder/sub-sub-folder/file8"
      }
    }
  }
}
```

# API

The `s3tree` accepts two options:
* `bucket` - Obligatory. The S3 bucket name
* `s3` - Optional. The `aws-sdk` S3 class instance. For example: `new AWS.S3({apiVersion: '2006-03-01')` 

The `s3tree.generate(path, callback)` function takes:
* `path` - any string. E.g. 
  *  `"/"`, `""`, or
  * `"/folder"`, `"folder/"`, `"folder"`, or
  * `"/1/2/3/4"`, `"1/2/3/4/"`, `"1/2/3/4"`, etc.
* `callback` - node-style callback which resolves to a tree object.

# CLI

## Install
```sh
$ npm i -g s3-tree
```

Usage:
```
s3-tree BUCKET [PATH]
```

Prints JSON object (aka the tree). Example:
```sh
$ s3-tree my-bucket-name my-folder/subfolder/
{
  "file1": "my-folder/subfolder/file1",
  "file2": "my-folder/subfolder/file2",
  "folder": {
    "file3": "my-folder/subfolder/folder/file3",
    "file4": "my-folder/subfolder/folder/file4",
    "sub-folder": {
      "file5": "my-folder/subfolder/folder/sub-folder/file5",
      "file6": "my-folder/subfolder/folder/sub-folder/file6",
      "sub-sub-folder": {
        "file7": "my-folder/subfolder/folder/sub-folder/sub-sub-folder/file7",
        "file8": "my-folder/subfolder/folder/sub-folder/sub-sub-folder/file8"
      }
    }
  }
}
$ 
```
