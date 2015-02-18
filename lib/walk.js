var fs = require('fs')
	, path = require('path');

/**
 * Walk directory tree from 'dir' returning all resources that match 'include'
 * @param {String} dir
 * @param {Regex} [include]
 * @param {Function} fn(err, matches)
 */
module.exports = function walk (dir, include, fn) {
	if (!include) include = /.*/;

};

/**
 * Walk directory tree from 'dir' returning all resources that match 'include'
 * @param {String} dir
 * @param {Regex} [include]
 * @returns {Array}
 */
module.exports.sync = function walkSync (dir, include) {
	if (!include) include = /.*/;

};