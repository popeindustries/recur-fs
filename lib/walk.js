var fs = require('fs')
	, Minimatch = require('minimatch').Minimatch
	, path = require('path');

/**
 * Walk directory tree from 'dir', passing all resources to 'handler'.
 * Stops walking if 'handler' calls next(false), or root directory reached.
 * @param {String} dir
 * @param {Function} handler(resource, next)
 * @param {Function} fn(err)
 */
module.exports = function walk (dir, handler, fn) {
	dir = path.resolve(dir);

	function visit (dir) {
		fs.readdir(dir, function (err, resources) {
			if (err) return fn(err);

			var outstanding = resources.length
				, stopped = false;

			resources.forEach(function (resource) {
				handler(path.join(dir, resource), function next (continueWalking) {
					if (continueWalking == false) stopped = true;

					if (!--outstanding) {
						var parent = path.resolve(dir, '..');

						// Stop if stopped or we can no longer go up a level
						if (stopped || parent.toLowerCase() === dir.toLowerCase()) return fn();

						// Up one level
						visit(parent);
					}
				});
			});
		});
	}

	visit(dir);
};

/**
 * Synchronously walk directory tree from 'dir', passing all resources to 'handler'.
 * Stops walking when root directory reached.
 * @param {String} dir
 * @param {Function} handler(resource)
 */
module.exports.sync = function walkSync (dir, handler) {
	dir = path.resolve(dir);

	function visit (dir) {
		var resources = fs.readdirSync(dir)
			, outstanding = resources.length;

		resources.forEach(function (resource) {
			handler(path.join(dir, resource));
			if (!--outstanding) {
				var parent = path.resolve(dir, '..');

				// Stop if we can no longer go up a level
				if (parent.toLowerCase() === dir.toLowerCase()) return;

				// Up one level
				visit(parent);
			}
		});
	}

	visit(dir);
};