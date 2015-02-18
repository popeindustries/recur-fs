var fs = require('fs')
	, mkdir = require('./mkdir')
	, path = require('path')
	, rm = require('./rm');

/**
 * Copy file or directory 'source' to 'destination'
 * Copies contents of 'source' if directory and ends in trailing '/'
 * @param {String} source
 * @param {String} destination
 * @param {Boolean} force
 * @param {Function} fn(err, filepath)
 */
module.exports = function cp (source, destination, force, fn) {
	var _base = ''
		, _filepath = ''
		, _first = true
		, _outstanding = 0;

	if (force == null) force = false;

	function cp (source, destination) {
		_outstanding++;
		fs.stat(source, function (err, stats) {
			var isDestFile;
			_outstanding--;
			// Exit if proper error, otherwise skip
			if (err) {
				if (err.code === 'ENOENT') return;
				else return fn(err);
			} else {
				isDestFile = path.extname(destination).length;
				// File
				if (stats.isFile()) {
					// Handle file or directory as destination
					var destDir = isDestFile ? path.dirname(destination) : destination
						, destName = isDestFile ? path.basename(destination) : path.basename(source)
						, filepath = path.resolve(destDir, destName);
					// Write file if it doesn't already exist
					if (!force && fs.existsSync(filepath)) {
						if (!_outstanding) return fn(null, _filepath);
					} else {
						rm(filepath, function (err) {
							// Ignore rm errors
							var file;
							_outstanding++;
							// Return the new path for the first source
							if (_first) {
								_filepath = filepath;
								_first = false;
							}
							// Pipe stream
							fs.createReadStream(source).pipe(file = fs.createWriteStream(filepath));
							file.on('error', function (err) { return fn(err); });
							file.on('close', function () {
								_outstanding--;
								// Return if no outstanding
								if (!_outstanding) return fn(null, _filepath);
							});
						});
					}
				// Directory
				} else {
					// Guard against invalid directory to file copy
					if (isDestFile) {
						fn(new Error('invalid destination for copy: ' + destination));
					} else {
						// Copy contents only if source ends in '/'
						var contentsOnly = _first && /\\$|\/$/.test(source)
							, dest = contentsOnly ? destination : path.resolve(destination, path.basename(source));
						// Create in destination
						_outstanding++;
						mkdir(dest, function (err) {
							_outstanding--;
							if (err) {
								return fn(err);
							} else {
								// Loop through contents
								_outstanding++;
								fs.readdir(source, function (err, files) {
									_outstanding--;
									// Exit if proper error, otherwise skip
									if (err) {
										if (err.code === 'ENOENT') return;
										else return fn(err);
									} else {
										// Return the new path for the first source
										if (_first) {
											_filepath = dest;
											_first = false;
										}
										// Loop through files and cp
										files.forEach(function (file) {
											cp(path.resolve(source, file), dest);
										});
										// Return if no outstanding
										if (!_outstanding) return fn(null, _filepath);
									}
								});
							}
						});
					}
				}
			}
		});
		// Return if no outstanding
		if (!_outstanding) return fn(null, _filepath);
	};

	return cp(source, destination);
};


/**
 * Synchronously copy file or directory 'source' to 'destination'
 * Copies contents of 'source' if directory and ends in trailing '/'
 * @param {String} source
 * @param {String} destination
 * @param {Boolean} force
 * @returns {String}
 */
module.exports.sync = function cpSync (source, destination, force) {
	var _base = ''
		, _filepath = ''
		, _first = true;

	if (force == null) force = false;

	function cpSync (source, destination) {
		if (fs.existsSync(source)) {
			var stats = fs.statSync(source)
				, isDestFile = path.extname(destination).length;

			// File
			if (stats.isFile()) {
				// Handle file or directory as destination
				var destDir = isDestFile ? path.dirname(destination) : destination
					, destName = isDestFile ? path.basename(destination) : path.basename(source)
					, filepath = path.resolve(destDir, destName);

				// Return the new path for the first source
				if (_first) {
					_filepath = filepath;
					_first = false;
				}
				// Write file only if it doesn't already exist
				if (fs.existsSync(filepath)) {
					if (!force) return _filepath;
					rm.sync(filepath);
				}
				fs.writeFileSync(filepath, fs.readFileSync(source));

			// Directory
			} else {
				// Guard against invalid directory to file copy
				if (isDestFile) throw new Error('invalid destination for copy: ' + destination);
				// Copy contents only if source ends in '/'
				var contentsOnly = _first && /\\$|\/$/.test(source)
					, dest = contentsOnly
							? destination
							: path.resolve(destination, path.basename(source));

				// Return the new path for the first source
				if (_first) {
					_filepath = dest;
					_first = false;
				}
				// Create in destination
				mkdir.sync(dest);
				// Loop through files and cpSync
				var files = fs.readdirSync(source);
				files.forEach(function (file) {
					cpSync(path.resolve(source, file), dest);
				});
			}
		}
		return _filepath;
	};

	return cpSync(source, destination);
};