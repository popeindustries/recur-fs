[![Build Status](https://travis-ci.org/popeindustries/buddy-fs.png)](https://travis-ci.org/popeindustries/buddy-fs)

A collection of recursive filesystem utilities.

## Installation

```bash
npm install buddy-fs
```

## Usage
```javascript
var fsutils = require('buddy-fs');

fsutils.indir('/some/directory', '/some/directory/file.js');
// Gather all files ending in '.js'
fsutils.readdir('/some/directory', /\.js$/, null, function(err, files, directories) {
  // Do something with 'files'
});
// Gather all files not ending in '.css'
fsutils.readdir('/some/directory', null, /\.css$/, function(err, files, directories) {
  // Do something with 'files'
});
// Make a directory and any missing parents (mkdir -p)
fsutils.mkdir('/some/directory', function(err) {
  // Do something
});
// Move a file to a new destination, calling mkdir if necessary
fsutils.mv('/some/file', '/some/destination', function(err, newfilepath) {
  // Do something with 'newfilepath'
});
// Copy a file to a new location (cp -r)
fsutils.cp('/some/file', '/some/destination', function(err, newfilepath) {
  // Do something with 'newfilepath'
});
// Copy the contents of a directory to a new location
// (note trailing slash)
fsutils.cp('/some/directory/contents/', '/some/destination', function(err, newdestination) {
  // Do something with 'newdestination'
});
// Delete a directory and all subdirectories (rm -rF)
fsutils.rm('/some/directory/and/children', function(err) {
  // Do something when complete
});

```
