var fs = require('fs')
	, path = require('path');

/**
 * Read the contents of 'directory', returning all resources.
 * 'visitor' is optional function called on each resource,
 * and resource is skipped if next() returns "false"
 * @param {String} dir
 * @param {Function} [visitor(resource, stat, next)]
 * @param {Function} fn(err, resources)
 */
module.exports = function readdir (directory, visitor, fn) {
	if (arguments.length == 2) {
		fn = visitor;
		// Noop
		visitor = function (resource, stat, next) { next(); };
	}

	var resources = []
		, outstanding = 0
		, done = function () {
				if (!--outstanding) fn(null, resources);
			};

	function visit (dir) {
		outstanding++;

		fs.readdir(dir, function (err, files) {
			if (err) {
				// Skip if not found, otherwise exit
				if (err.code === 'ENOENT') return done();
				return fn(err);
			}

			// Include dir
			outstanding += files.length - 1;

			files.forEach(function (file) {
				file = path.join(dir, file);
				fs.stat(file, function (err, stat) {
					if (err) {
						// Skip if not found, otherwise exit
						if (err.code === 'ENOENT') return done();
						return fn(err);
					}

					visitor(file, stat, function next (include) {
						// Store
						if (include !== false) resources.push(file);
						// Recurse child directory
						if (stat.isDirectory()) visit(file);
						done();
					});
				});
			});
		});
	}

	visit(directory);
};

/**
 * Synchronously read the contents of 'directory', returning all resources.
 * 'visitor' is optional function called on each resource,
 * and resource is skipped if visitor returns "false"
 * @param {String} dir
 * @param {Function} [visitor(resource, stat)]
 * @returns {Array}
 */
module.exports.sync = function readdirSync (directory, visitor) {
	visitor = visitor || function (resource, stat, next) { };

	var resources = [];

	function visit (dir) {
		if (fs.existsSync(dir)) {
			fs.readdirSync(dir).forEach(function (file) {
				file = path.resolve(dir, file);
				try {
					var stat = fs.statSync(file);
				} catch (err) {
					// Skip if file not found, otherwise throw
					if (err.code === 'ENOENT') {
						return;
					} else {
						throw err;
					}
				}

				// Store
				var include = visitor(file, stat)
				if (include !== false) resources.push(file);

				// Recurse child directory
				if (stat.isDirectory()) visit(file);
			});
		}
	}

	visit(directory);

	return resources;
};
