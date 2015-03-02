var fs = require('fs')
	, rimraf = require('rimraf');

/**
 * Recursive remove file or directory
 * Makes sure only project sources are removed
 * @param {String} source
 * @param {Function} fn(err)
 */
module.exports = function rm (source, fn) {
	if (fs.existsSync(source)) {
		if (~source.indexOf(process.cwd())) {
			rimraf(source, function (err) {
				if (err) return fn(err);
				else return fn();
			});
		} else {
			fn(new Error('cannot rm source outside of project path: ' + source));
		}
	} else {
		fn(new Error('cannot rm non-existant source: ' + source));
	}
};

/**
 * Synchronously recursive remove file or directory
 * Makes sure only project sources are removed
 * @param {String} source
 */
module.exports.sync = function rmSync (source) {
	if (fs.existsSync(source)) {
		if (~source.indexOf(process.cwd())) {
			rimraf.sync(source)
		} else {
			throw new Error('cannot rm source outside of project path: ' + source);
		}
	} else {
		throw new Error('cannot rm non-existant source: ' + source);
	}
};
