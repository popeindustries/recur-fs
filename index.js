var fs = require('fs')
	, path = require('path')
	, mkdirp = require('mkdirp')
	, rimraf = require('rimraf');

// Node 0.8.0 api change
var existsSync = exports.existsSync = fs.existsSync || path.existsSync;
var exists = exports.exists = fs.exists || path.exists;

// starts with '.' or '~', ends with '~'
exports.RE_HIDDEN = /^[\.~]|~$/;

/**
 * Check that a 'filepath' is likely a child of a given directory
 * Applies to nested directories
 * Only makes String comparison. Does not check for existance
 * @param {String} dir
 * @param {String} filepath
 * @returns {Boolean}
 */
exports.indir = function (dir, filepath) {
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

/**
 * Read and store the contents of a directory, ignoring files of type specified
 * @param {String} dir
 * @param {Regex} include
 * @param {Regex} ignore
 * @param {Function} fn(err, files, directories)
 */
var readdir = exports.readdir = function (dir, include, ignore, fn) {
	var _files = []
		, _directories = []
		, _outstanding = 0
		, _readdir;
	if (!include) include = /.*/;
	if (!ignore) ignore = exports.RE_HIDDEN;

	function readdir (dir) {
		if (existsSync(dir)) {
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
								// Store if not ignored
								if (include.test(path.basename(filepath)) && !ignore.test(path.basename(filepath))) {
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
 * @param {Regex} include
 * @param {Regex} ignore
 * @returns {Object}
 */
var readdirSync = exports.readdirSync = function (dir, include, ignore) {
	var fd = {
		files: [],
		directories: []
	};

	if (!include) include = /.*/;
	if (!ignore) ignore = exports.RE_HIDDEN;

	function readdirSync (dir) {
		if (existsSync(dir)) {
			fd.directories.push(dir);
			fs.readdirSync(dir)
				.forEach(function (file) {
					var filepath = path.resolve(dir, file)
						, stats = fs.statSync(filepath);
					// Recurse child directory
					if (stats.isDirectory()) {
						return readdirSync(filepath);
					} else {
						// Store if not ignored
						if (include.test(path.basename(filepath)) && !ignore.test(path.basename(filepath))) {
							fd.files.push(filepath);
						}
					}
				});
		}
		return fd;
	}

	return readdirSync(dir);
};

/**
 * Recursively create directory path specified by 'filepath'
 * @param {String} filepath
 * @param {Function} fn(err)
 */
var mkdir = exports.mkdir = function (filepath, fn) {
	// Resolve directory name if passed a file
	var dir = path.extname(filepath)
		? path.dirname(filepath)
		: filepath;

	if (!existsSync(dir)) {
		mkdirp(dir, function (err) {
			if (err) return fn(err);
			else return fn();
		});
	} else {
		return fn();
	}
};

/**
 * Synchronously create recursive directory path specified by 'filepath'
 * @param {String} filepath
 */
var mkdirSync = exports.mkdirSync = function (filepath) {
	// Resolve directory name if passed a file
	var dir = path.extname(filepath)
		? path.dirname(filepath)
		: filepath;

	if (!existsSync(dir)) {
		mkdirp.sync(dir);
	}
};

/**
 * Move file or directory 'source' to 'destination'
 * @param {String} source
 * @param {String} destination
 * @param {Boolean} force
 * @param {Function} fn(err, filepath)
 */
var mv = exports.mv = function (source, destination, force, fn) {
	if (force == null) force = false;
	mkdir(destination, function (err) {
		if (err) {
			return fn(err);
		} else {
			var filepath = path.resolve(destination, path.basename(source));
			if (!force && existsSync(filepath)) {
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
var mvSync = exports.mvSync = function (source, destination, force) {
	if (force == null) force = false;

	if (!existsSync(destination)) mkdirSync(destination);
	var filepath = path.resolve(destination, path.basename(source));
	if (existsSync(filepath)) {
		if (!force) return filepath;
		rmSync(filepath);
	}
	fs.renameSync(source, filepath);

	return filepath;
};

/**
 * Copy file or directory 'source' to 'destination'
 * Copies contents of 'source' if directory and ends in trailing '/'
 * @param {String} source
 * @param {String} destination
 * @param {Boolean} force
 * @param {Function} fn(err, filepath)
 */
var cp = exports.cp = function (source, destination, force, fn) {
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
					if (!force && existsSync(filepath)) {
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
var cpSync = exports.cpSync = function (source, destination, force) {
	var _base = ''
		, _filepath = ''
		, _first = true;

	if (force == null) force = false;

	function cpSync (source, destination) {
		if (existsSync(source)) {
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
				if (existsSync(filepath)) {
					if (!force) return _filepath;
					rmSync(filepath);
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
				mkdirSync(dest);
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

/**
 * Recursive remove file or directory
 * Makes sure only project sources are removed
 * @param {String} source
 * @param {Function} fn(err)
 */
var rm = exports.rm = function (source, fn) {
	if (existsSync(source)) {
		if (source.indexOf(process.cwd()) != -1) {
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
var rmSync = exports.rmSync = function (source) {
	if (existsSync(source)) {
		if (source.indexOf(process.cwd()) != -1) {
			rimraf.sync(source)
		} else {
			throw new Error('cannot rm source outside of project path: ' + source);
		}
	} else {
		throw new Error('cannot rm non-existant source: ' + source);
	}
};
