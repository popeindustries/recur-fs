var fs = require('fs')
	, path = require('path')

	// starts with '.' or '~', ends with '~'
	, RE_HIDDEN = /^[\.~]|~$/;

/**
 * Read and store the contents of a directory, ignoring files of type specified
 * @param {String} dir
 * @param {Regex} [include]
 * @param {Regex} [exclude]
 * @param {Function} fn(err, files, directories)
 */
module.exports = function readdir (dir, include, exclude, fn) {
	var _files = []
		, _directories = []
		, _outstanding = 0
		, _readdir;
	if (!include) include = /.*/;
	if (!exclude) exclude = RE_HIDDEN;

	function readdir (dir) {
		if (fs.existsSync(dir)) {
			_directories.push(dir);
			_outstanding++;
			return fs.readdir(dir, function (err, files) {
				_outstanding--;
				if (err) return fn(err);
				files.forEach(function (file) {
					var filepath = path.resolve(dir, file);
					_outstanding++;
					return fs.stat(filepath, function (err, stats) {
						_outstanding--;
						if (err) {
							// Exit if proper error, otherwise skip
							if (err.code === 'ENOENT') return;
							else return fn(err);
						} else {
							// Recurse child directory
							if (stats.isDirectory()) {
								return readdir(filepath);
							} else {
								// Store if not excluded
								if (include.test(path.basename(filepath)) && !exclude.test(path.basename(filepath))) {
									_files.push(filepath);
								}
								// Return if no outstanding
								if (!_outstanding) return fn(null, _files, _directories);
							}
						}
					});
				});
				// Return if no outstanding
				if (!_outstanding) return fn(null, _files, _directories);
			});
		// Return if no outstanding
		} else if (!_outstanding) return fn(null, _files, _directories);
	};

	return readdir(dir);
};

/**
 * Synchronously read and store the contents of a directory, ignoring files of type specified
 * @param {String} dir
 * @param {Regex} [include]
 * @param {Regex} [exclude]
 * @returns {Object}
 */
module.exports.sync = function readdirSync (dir, include, exclude) {
	var fd = {
		files: [],
		directories: []
	};

	if (!include) include = /.*/;
	if (!exclude) exclude = RE_HIDDEN;

	function readdirSync (dir) {
		if (fs.existsSync(dir)) {
			fd.directories.push(dir);
			fs.readdirSync(dir)
				.forEach(function (file) {
					var filepath = path.resolve(dir, file)
						, stats = fs.statSync(filepath);
					// Recurse child directory
					if (stats.isDirectory()) {
						return readdirSync(filepath);
					} else {
						// Store if not excluded
						if (include.test(path.basename(filepath)) && !exclude.test(path.basename(filepath))) {
							fd.files.push(filepath);
						}
					}
				});
		}
		return fd;
	}

	return readdirSync(dir);
};
