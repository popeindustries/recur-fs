var fs = require('fs')
	, Minimatch = require('minimatch').Minimatch
	, path = require('path')
	, walk = require('./walk');

/**
 * Walk directory tree from 'dir', returning all resources matching 'matcher'.
 * Stops walking when root directory reached, or on first match if 'options.stopOnFirst'.
 * @param {String} dir
 * @param {String|Function} matcher(resource, next)
 * @param {Object} options
 * @param {Function} fn(err, matches)
 */
module.exports = function hunt (dir, matcher, options, fn) {
	dir = path.resolve(dir);
	options = options || {
		stopOnFirst: false
	};
	// Convert glob string to async matcher function
	if ('string' == typeof matcher) {
		var match = new Minimatch(matcher, { matchBase: true });
		matcher = function matcher (resource, done) {
			done(match.match(resource));
		};
	}

	var matches = []
		, finished = false;

	// Walk and match each resource
	walk(dir, function (resource, done) {
		if (!finished) {
			matcher(resource, function (isMatch, continueWalking) {
				if (isMatch ) {
					matches.push(resource);
					finished = options.stopOnFirst;
				}

				if (continueWalking == false) finished = true;

				// Stop walking if finished
				done(!finished);
			});
		}
	}, function (err) {
		if (err) return fn(err);
		return fn(null, options.stopOnFirst ? matches[0] : matches);
	});
};

/**
 * Synchronously walk directory tree from 'dir', returning all resources matching 'matcher'.
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
	walk.sync(dir, function (resource) {
		if (!finished) {
			var isMatch = matcher(resource);
			if (isMatch) {
				matches.push(resource);
				finished = options.stopOnFirst;
			}
		}
	});

	return options.stopOnFirst ? matches[0] : matches;
};