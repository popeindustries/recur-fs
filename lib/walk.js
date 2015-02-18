var fs = require('fs')
	, path = require('path');

/**
 * Walk directory tree from 'dir' returning all resources that match 'include'.
 * 'include' can be a function returning true/false
 * @param {String} dir
 * @param {Regex|Function} [include]
 * @param {Function} fn(err, matches)
 */
module.exports = function walk (dir, include, fn) {

};

/**
 * Walk directory tree from 'dir' returning all resources that match 'include'.
 * 'include' can be a function returning true/false
 * @param {String} dir
 * @param {Regex|Function} [include]
 * @returns {Array}
 */
module.exports.sync = function walkSync (dir, include) {

};