var fs = require('fs')
	, mkdir = require('./mkdir')
	, path = require('path')
	, rm = require('./rm');

/**
 * Move file or directory 'source' to 'destination'
 * @param {String} source
 * @param {String} destination
 * @param {Boolean} force
 * @param {Function} fn(err, filepath)
 */
module.exports = function mv (source, destination, force, fn) {
	if (force == null) force = false;

	mkdir(destination, function (err) {
		if (err) {
			return fn(err);
		} else {
			var filepath = path.resolve(destination, path.basename(source));

			if (!force && fs.existsSync(filepath)) {
				return fn(null, filepath);
			} else {
				rm(filepath, function (err) {
					// Ignore rm errors
					fs.rename(source, filepath, function (err) {
						if (err) return fn(err);
						return fn(null, filepath);
					});
				});
			}
		}
	});
};

/**
 * Synchronously move file or directory 'source' to 'destination'
 * @param {String} source
 * @param {String} destination
 * @param {Boolean} force
 * @returns {String}
 */
module.exports.sync = function mvSync (source, destination, force) {
	if (force == null) force = false;

	if (!fs.existsSync(destination)) mkdir.sync(destination);

	var filepath = path.resolve(destination, path.basename(source));

	if (fs.existsSync(filepath)) {
		if (!force) return filepath;
		rm.sync(filepath);
	}
	fs.renameSync(source, filepath);

	return filepath;
};