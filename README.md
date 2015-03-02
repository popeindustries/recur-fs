[![Build Status](https://travis-ci.org/popeindustries/recur-fs.png)](https://travis-ci.org/popeindustries/recur-fs)

A collection of recursive filesystem utilities.

## Installation

```bash
npm install recur-fs
```

## Usage
```javascript
var fs = require('recur-fs');

// Gather all files ending in '.js'
fs.readdir('/some/directory', function (resource, stat, next) {
  // Return 'true' to skip adding to 'resources'
  next(resource.indexOf('.js') == -1);
}, function(err, resources) {
  // Do something with 'resources'
});

// Make a directory and any missing parents (mkdir -p)
fs.mkdir('/some/directory', function(err) {
  // Do something
});

// Move a file to a new destination, calling mkdir if necessary
fs.mv('/some/file', '/some/destination', function(err, filepath) {
  // Do something with new 'filepath'
});

// Copy a file to a new location (cp -r)
fs.cp('/some/file', '/some/destination', function(err, filepath) {
  // Do something with new 'filepath'
});

// Copy the contents of a directory to a new location
// (note trailing slash)
fs.cp('/some/directory/contents/', '/some/destination', function(err, filepath) {
  // Do something with new 'filepath'
});

// Delete a directory and all subdirectories (rm -rF)
fs.rm('/some/directory/and/children', function(err) {
  // Do something when complete
});

// Walk a directory tree until root directory, visiting all resources
fs.walk('/some/directory', function (resource, stat, next) {
  // Return 'true' to stop walking
  next(resource == 'index.js');
}, function (err) {
  // Handle error
});

// Walk directory tree until root directory, returning all matching resources
fs.hunt('/some/directory', '*.js', function (err, matches) {
  // Do something with all 'matches'
});
```

## API

**readdir(directory, visitor, fn)**

**walk(directory, visitor, fn)**

**hunt(directory, matcher, stopOnFirstMatch, fn)**

**cp(source, destination, force, fn)**

**mkdir(filepath, fn)**

**mv(source, destination, force, fn)**

**rm(source, fn)**

**indir(directory, filepath)**
