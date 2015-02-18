var fs = require('fs')
	, mkdirp = require('mkdirp')
	, path = require('path');

/**
 * Recursively create directory path specified by 'filepath'
 * @param {String} filepath
 * @param {Function} fn(err)
 */
module.exports = function mkdir (filepath, fn) {
	// Resolve directory name if passed a file
	var dir = path.extname(filepath)
		? path.dirname(filepath)
		: filepath;

	if (!fs.existsSync(dir)) {
		mkdirp(dir, function (err) {
			if (err) return fn(err);
			return fn();
		});
	} else {
		return fn();
	}
};

/**
 * Synchronously create recursive directory path specified by 'filepath'
 * @param {String} filepath
 */
module.exports.sync = function mkdirSync (filepath) {
	// Resolve directory name if passed a file
	var dir = path.extname(filepath)
		? path.dirname(filepath)
		: filepath;

	if (!fs.existsSync(dir)) {
		mkdirp.sync(dir);
	}
};
