var path = require('path');

/**
 * Check that a 'filepath' is likely a child of a given directory
 * Applies to nested directories
 * Only makes String comparison. Does not check for existance
 * @param {String} dir
 * @param {String} filepath
 * @returns {Boolean}
 */
module.exports = function indir (dir, filepath) {
	dir = path.resolve(dir);
	filepath = path.resolve(filepath);
	if (filepath.indexOf(dir) != -1) {
		if (path.relative(dir, filepath).indexOf('..') != -1) {
			return false;
		} else {
			return true;
		}
	} else {
		return false;
	}
};
