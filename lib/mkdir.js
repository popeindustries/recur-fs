var fs = require('fs')
	, mkdirp = require('mkdirp')
	, path = require('path');

/**
 * Recursively create 'directory'
 * @param {String} directory
 * @param {Function} fn(err)
 */
module.exports = function mkdir (directory, fn) {
	// Resolve directory name if passed a file
	directory = path.extname(directory)
		? path.dirname(directory)
		: directory;

	if (!fs.existsSync(directory)) {
		mkdirp(directory, function (err) {
			if (err) return fn(err);
			return fn();
		});
	} else {
		return fn();
	}
};

/**
 * Synchronously create 'directory'
 * @param {String} directory
 */
module.exports.sync = function mkdirSync (directory) {
	// Resolve directory name if passed a file
	directory = path.extname(directory)
		? path.dirname(directory)
		: directory;

	if (!fs.existsSync(directory)) {
		mkdirp.sync(directory);
	}
};
