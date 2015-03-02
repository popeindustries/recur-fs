var fs = require('fs')
	, Minimatch = require('minimatch').Minimatch
	, path = require('path')
	, walk = require('./walk');

/**
 * Walk directory tree from 'dir', returning all resources matching 'matcher'.
 * 'matcher' can be glob string, or function that returns 'isMatch'.
 * Stops walking when root directory reached, on first match if 'stopOnFirstMatch',
 * or if "true" is returned as second argument from 'matcher'.
 * @param {String} dir
 * @param {String|Function} matcher(resource, stat, next)
 * @param {Object} options
 * @param {Function} fn(err, matches)
 */
module.exports = function hunt (dir, matcher, stopOnFirstMatch, fn) {
	dir = path.resolve(dir);

	// Convert glob string to async matcher function
	if ('string' == typeof matcher) {
		var match = new Minimatch(matcher, { matchBase: true });
		matcher = function matcher (resource, stat, done) {
			done(match.match(resource));
		};
	}

	var matches = []
		, finished = false;

	// Walk and match each resource
	walk(dir, function (resource, stat, next) {
		if (!finished) {
			matcher(resource, stat, function (isMatch, stop) {
				if (isMatch) {
					matches.push(resource);
					finished = stopOnFirstMatch;
				}

				if (stop === true) finished = true;

				// Stop walking if finished
				next(finished);
			});
		}
	}, function (err) {
		if (err) return fn(err);
		return fn(null, stopOnFirstMatch ? matches[0] : matches);
	});
};

/**
 * Synchronously walk directory tree from 'dir', returning all resources matching 'matcher'.
 * 'matcher' can be glob string, or function that returns 'isMatch'.
 * Stops walking when root directory reached, or on first match if 'options.stopOnFirst'.
 * @param {String} dir
 * @param {String|Function} matcher(resource, next)
 * @param {Object} options
 * @returns (Array|String}
 */
module.exports.sync = function huntSync (dir, matcher, options) {
	dir = path.resolve(dir);
	options = options || {
		stopOnFirst: false
	};
	if ('string' == typeof matcher) {
		var match = new Minimatch(matcher, { matchBase: true });
		matcher = function matcher (resource) {
			return match.match(resource);
		};
	}

	var matches = []
		, finished = false;

	// Walk and match each resource
	walk.sync(dir, function (resource, stat) {
		if (!finished) {
			var isMatch = matcher(resource, stat);
			if (isMatch) {
				matches.push(resource);
				finished = options.stopOnFirst;
			}
		}
	});

	return options.stopOnFirst ? matches[0] : matches;
};