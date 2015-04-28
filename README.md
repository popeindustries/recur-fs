[![NPM Version](https://img.shields.io/npm/v/recur-fs.svg?style=flat)](https://npmjs.org/package/recur-fs)
[![Build Status](https://img.shields.io/travis/popeindustries/recur-fs.svg?style=flat)](https://travis-ci.org/popeindustries/recur-fs)

A collection of recursive filesystem utilities.

## Installation

```bash
npm install recur-fs
```

## Usage
```javascript
var fs = require('recur-fs');

// Gather all nested files and directories
fs.readdir('/some/directory', function(err, resources) {
  // Do something with 'resources'
});
```

## API

**readdir(directory, visitor(_resource, stat, next_), fn(_err, resources_))** Recursively read contents of `directory`, returning all resources. `visitor` is an optional function called on each resource. Calling `next(false)` from `visitor` will exclude resource from the collection.

```js
fs.readdir('/some/directory', function (err, resources) {
  // Do something with 'resources'
});

fs.readdir('/some/other/directory', function (resource, stat, next) {
  // Return 'false' to skip adding to 'resources'
  next(stat.isFile());
}, function(err, resources) {
  // Do something with 'resources'
});
```

**readdir.sync(directory, visitor(_resource, stat_))** Synchronously, recursively read contents of `directory`, returning all resources. `visitor` is an optional function called on each resource. Returning `false` from `visitor` will exclude resource from the collection.

```js
var resources = fs.readdir.sync('/some/directory');

var files = fs.readdir.sync('/some/other/directory', function (resource, stat) {
  // Return 'false' to skip adding to 'resources'
  return stat.isFile();
});
```

**walk(directory, visitor(_resource, stat, next_), fn(_err_))** Walk up filesystem tree from `directory`, passing all resources to `visitor`, and stopping when root directory is reached. Calling `next(true)` will abort walking before completion.

```js
fs.walk('/some/directory', function (resource, stat, next) {
  // Return 'true' to stop walking
  next(resource == 'index.js');
}, function (err) {
  // Handle error
});
```

**walk.sync(directory, visitor(_resource, stat_))** Synchronously walk up filesystem tree from `directory`, passing all resources to `visitor`, and stopping when root directory is reached, or visitor returns `true`.

```js
fs.walk.sync('/some/directory', function (resource, stat) {
  // Do something with resource
});
```

**hunt(directory, matcher(_resource, stat, next_), stopOnFirstMatch, fn(_err, matches_))** Walk up filesystem tree from `directory`, returning all resources matched with `matcher`, and stopping when root directory is reached, or after first match if `stopOnFirstMatch=true`.

`matcher` can be a glob-type string (see [minimatch](https://github.com/isaacs/minimatch)), or function calling `next(true)` to signal a match. In addition, `next` also accepts a second argument in order to abort before completion.

```js
fs.hunt('/some/directory', '*.js', false, function (err, matches) {
  // Do something with matching js files
});

fs.hunt('/some/directory', '*.css', true, function (err, match) {
  // Do something with single matching css file
});

fs.hunt('/some/other/directory', function (resource, stat, next) {
  if (resource == 'index.js') {
    // Return second argument to stop walking
    next(true, true);
  } else {
    next(false);
  }
}, false, function (err, matches) {
  // Do something with matches
});
```

**hunt.sync(directory, matcher(_resource, stat_), stopOnFirstMatch)** Synchronously walk up filesystem tree from `directory`, returning all resources matched with `matcher`, and stopping when root directory is reached, or after first match if `stopOnFirstMatch=true`.

`matcher` can be a glob-type string (see [minimatch](https://github.com/isaacs/minimatch)), or function returning `true` to signal a match.

```js
var jsFiles = fs.hunt.sync('/some/directory', '*.js', false);

var cssFile = fs.hunt.sync('/some/directory', '*.css', true);

var index = fs.hunt.sync('/some/other/directory', function (resource, stat) {
  return (resource == 'index.js');
}, true);
```

**cp(source, destination, force, fn(_err, filepath_))** Recursively copy `source` to `destination` (`cp -r`). Copies contents of `source` directory if path contains a trailing `/`. `force=true` will overwrite `destination` if it already exists.

```js
fs.cp('/some/file', '/some/destination', true, function(err, filepath) {
  // Do something with new 'filepath'
});

// Copy directory contents (note trailing slash)
fs.cp('/some/directory/contents/', '/some/destination', true, function(err, filepath) {
  // Do something with new 'filepath'
});
```
**cp.sync(source, destination, force)** Synchronously, recursively copy `source` to `destination` (`cp -r`). Copies contents of `source` directory if path contains a trailing `/`. `force=true` will overwrite `destination` if it already exists.

```js
var filepath = fs.cp('/some/file', '/some/destination', true);
```

**mkdir(directory, fn(_err_))** Recursively create nested `directory` (`mkdir -p`). If `directory` looks like a filepath (has .extension), directories will be created at `path.dirname(directory)`.

```js
fs.mkdir('/some/directory', function(err) {
  // Do something
});
```

**mkdir.sync(directory)** Synchronously, recursively create nested `directory` (`mkdir -p`). If `directory` looks like a filepath (has .extension), directories will be created at `path.dirname(directory)`.

```js
fs.mkdir.sync('/some/directory');
```

**mv(source, destination, force, fn(_err, filepath_))** Move `source` to `destination`, including all contents of `source` if directory. `force=true` will overwrite `destination` if it already exists.

```js
fs.mv('/some/file', '/some/destination', function(err, filepath) {
  // Do something with new 'filepath'
});
```

**mv.sync(source, destination, force)** Synchronously move `source` to `destination`, including all contents of `source` if directory. `force=true` will overwrite `destination` if it already exists.

```js
fs.mv.sync('/some/file', '/some/destination');
```

**rm(source, fn(_err_))** Recursively remove `source` (`rm -rf`). Prevents removal of resources outside of `process.cwd()`.

```js
fs.rm('/some/directory/and/children', function(err) {
  // Do something when complete
});
```

**rm.sync(source)** Synchronously, recursively remove `source` (`rm -rf`). Prevents removal of resources outside of `process.cwd()`.

```js
fs.rm.sync('/some/directory/and/children');
```

**indir(directory, filepath)** Check that `filepath` is likely child of `directory`. **NOTE**: only makes string comparison.

```js
fs.indir('/some/directory', '/some/directory/file');
```
