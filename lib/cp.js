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
	var filepath = ''
		, first = true
		, outstanding = 0;

	if (force == null) force = false;

	function copy (source, destination) {
		outstanding++;
		fs.stat(source, function (err, stat) {
			var isDestFile;
			outstanding--;
			// Exit if proper error, otherwise skip
			if (err) {
				if (err.code === 'ENOENT') return;
				return fn(err);
			} else {
				isDestFile = path.extname(destination).length;
				// File
				if (stat.isFile()) {
					// Handle file or directory as destination
					var destDir = isDestFile ? path.dirname(destination) : destination
						, destName = isDestFile ? path.basename(destination) : path.basename(source)
						, filepath = path.resolve(destDir, destName);
					// Write file if it doesn't already exist
					if (!force && fs.existsSync(filepath)) {
						if (!outstanding) return fn(null, filepath);
					} else {
						rm(filepath, function (err) {
							// Ignore rm errors
							var file;
							outstanding++;
							// Return the new path for the first source
							if (first) {
								filepath = filepath;
								first = false;
							}
							// Pipe stream
							fs.createReadStream(source).pipe(file = fs.createWriteStream(filepath));
							file.on('error', function (err) { return fn(err); });
							file.on('close', function () {
								outstanding--;
								// Return if no outstanding
								if (!outstanding) return fn(null, filepath);
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
						var contentsOnly = first && /\\$|\/$/.test(source)
							, dest = contentsOnly ? destination : path.resolve(destination, path.basename(source));

						// Create in destination
						outstanding++;
						mkdir(dest, function (err) {
							outstanding--;
							if (err) {
								return fn(err);
							} else {
								// Loop through contents
								outstanding++;
								fs.readdir(source, function (err, files) {
									outstanding--;
									// Exit if proper error, otherwise skip
									if (err) {
										if (err.code === 'ENOENT') return;
										else return fn(err);
									} else {
										// Return the new path for the first source
										if (first) {
											filepath = dest;
											first = false;
										}
										// Loop through files and cp
										files.forEach(function (file) {
											copy(path.resolve(source, file), dest);
										});
										// Return if no outstanding
										if (!outstanding) return fn(null, filepath);
									}
								});
							}
						});
					}
				}
			}
		});
		// Return if no outstanding
		if (!outstanding) return fn(null, filepath);
	};

	return copy(source, destination);
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
	var filepath = ''
		, first = true;

	if (force == null) force = false;

	function copy (source, destination) {
		if (fs.existsSync(source)) {
			var stat = fs.statSync(source)
				, isDestFile = path.extname(destination).length;

			// File
			if (stat.isFile()) {
				// Handle file or directory as destination
				var destDir = isDestFile ? path.dirname(destination) : destination
					, destName = isDestFile ? path.basename(destination) : path.basename(source)
					, filepath = path.resolve(destDir, destName);

				// Return the new path for the first source
				if (first) {
					filepath = filepath;
					first = false;
				}
				// Write file only if it doesn't already exist
				if (fs.existsSync(filepath)) {
					if (!force) return filepath;
					rm.sync(filepath);
				}
				fs.writeFileSync(filepath, fs.readFileSync(source));

			// Directory
			} else {
				// Guard against invalid directory to file copy
				if (isDestFile) throw new Error('invalid destination for copy: ' + destination);
				// Copy contents only if source ends in '/'
				var contentsOnly = first && /\\$|\/$/.test(source)
					, dest = contentsOnly
							? destination
							: path.resolve(destination, path.basename(source));

				// Return the new path for the first source
				if (first) {
					filepath = dest;
					first = false;
				}
				// Create in destination
				mkdir.sync(dest);
				// Loop through files and copy
				var files = fs.readdirSync(source);
				files.forEach(function (file) {
					copy(path.resolve(source, file), dest);
				});
			}
		}
		return filepath;
	};

	return copy(source, destination);
};