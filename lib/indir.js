var path = require('path');

/**
 * Check that a 'filepath' is likely a child of a given directory
 * Applies to nested directories
 * Only makes String comparison. Does not check for existance
 * @param {String} directory
 * @param {String} filepath
 * @returns {Boolean}
 */
module.exports = function indir (directory, filepath) {
	if (directory && filepath) {
		directory = path.resolve(directory);
		filepath = path.resolve(filepath);

		if (~filepath.indexOf(directory)) {
			return !~path.relative(directory, filepath).indexOf('..');
		}
	}

	return false;
};
