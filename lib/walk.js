var fs = require('fs')
	, path = require('path');

/**
 * Walk directory tree from 'dir', passing all resources to 'handler'.
 * Stops walking if 'visitor' calls next(true), or root directory reached.
 * @param {String} dir
 * @param {Function} visitor(resource, stat, next)
 * @param {Function} fn(err)
 */
module.exports = function walk (dir, visitor, fn) {
	dir = path.resolve(dir);

	function visit (dir) {
		function next (finished) {
			var parent = path.resolve(dir, '..');

			// Stop if finished or we can no longer go up a level
			if (finished || parent.toLowerCase() === dir.toLowerCase()) return fn();

			// Up one level
			visit(parent);
		}

		fs.readdir(dir, function (err, files) {
			if (err) return fn(err);

			var outstanding = files.length
				, finished = false;

			files.forEach(function (file) {
				file = path.join(dir, file);
				fs.stat(file, function (err, stat) {
					if (err) {
						// Skip if not found, otherwise exit
						if (err.code === 'ENOENT') {
							return (!--outstanding) ? next(finished) : null;
						}	else {
							return fn(err);
						}
					}

					if (!finished) {
						visitor(file, stat, function (stop) {
							if (stop === true) finished = true;

							if (!--outstanding) next(finished);
						});

					// Already finished
					} else {
						if (!--outstanding) return fn();
					}
				});
			});
		});
	}

	visit(dir);
};

/**
 * Synchronously walk directory tree from 'dir', passing all resources to 'visitor'.
 * Stops walking when root directory reached.
 * @param {String} dir
 * @param {Function} visitor(resource)
 */
module.exports.sync = function walkSync (dir, visitor) {
	dir = path.resolve(dir);

	function visit (dir) {
		var files = fs.readdirSync(dir)
			, outstanding = files.length
			, next = function () {
					var parent = path.resolve(dir, '..');

					// Stop if we can no longer go up a level
					if (parent.toLowerCase() === dir.toLowerCase()) return;

					// Up one level
					visit(parent);
				};

		files.forEach(function (file) {
			file = path.join(dir, file);
			try {
				var stat = fs.statSync(file);
			} catch (err) {
				// Skip if file not found, otherwise throw
				if (err.code === 'ENOENT') {
					return (!--outstanding) ? next() : null;
				} else {
					throw err;
				}
			}

			visitor(file, stat);
			if (!--outstanding) return next();
		});
	}

	visit(dir);
};