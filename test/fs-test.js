var path = require('path')
	, fs = require('fs')
	, should = require('should')
	, rimraf = require('rimraf')
	, fsutils = require('..')
	, indir = fsutils.indir
	, readdir = fsutils.readdir
	, mkdir = fsutils.mkdir
	, mv = fsutils.mv
	, rm = fsutils.rm
	, cp = fsutils.cp
	, walk = fsutils.walk
	, hunt = fsutils.hunt;

describe('recur-fs', function () {
	before(function () {
		process.chdir(path.resolve(__dirname, 'fixtures'))
	});

	describe('indir', function () {
		it('should return true when checking a filepath that resides in a directory', function () {
			indir('/some/directory', '/some/directory/file.js').should.be.true;
			indir('/some/directory', '/some/directory/nested/file.js').should.be.true;
		});
		it('should return false when checking a filepath that does not reside in a directory', function () {
			indir('/some/directory', '/another/directory/file.js').should.be.false;
			indir('/some/directory', '/some/other/directory/file.js').should.be.false;
		});
	});

	describe('readdir', function () {
		describe('async', function () {
			it('should read the contents of a flat directory', function (done) {
				readdir(path.resolve('readdir-simple'), function (err, resources) {
					(resources.length >= 4).should.be.true;
					done();
				});
			});
			it('should read the contents of a nested directory', function (done) {
				readdir(path.resolve('readdir-nested'), function (err, resources) {
					(resources.length >= 6).should.be.true;
					done();
				});
			});
			it('should call a passed visitor function for each resource', function (done) {
				var files = [];
				readdir(path.resolve('readdir-simple'), function (resource, stat, next) {
					if (stat.isFile()) files.push(resource);
					next();
				}, function (err, resources) {
					files.should.have.length(4);
					done();
				});
			});
			it('should skip resources if a passed visitor function returns "true"', function (done) {
				readdir(path.resolve('readdir-simple'), function (resource, stat, next) {
					next(true);
				}, function (err, resources) {
					resources.should.have.length(0);
					done();
				});
			});
		});
		describe('sync', function () {
			it('should read the contents of a flat directory', function () {
				var resources = readdir.sync(path.resolve('readdir-simple'));
				(resources.length >= 4).should.be.true;
			});
			it('should read the contents of a nested directory', function () {
				var resources = readdir.sync(path.resolve('readdir-nested'));
				(resources.length >= 6).should.be.true;
			});
			it('should call a passed visitor function for each resource', function () {
				var files = [];
				readdir.sync(path.resolve('readdir-simple'), function (resource, stat) {
					if (stat.isFile()) files.push(resource);
				});
				files.should.have.length(4);
			});
			it('should skip resources if a passed visitor function returns "true"', function () {
				readdir(path.resolve('readdir-simple'), function (resource, stat, next) {
					return true;
				}, function (err, resources) {
					resources.should.have.length(0);
					done();
				});
			});
		});
	});

	describe('mkdir', function () {
		beforeEach(function () {
			fs.mkdirSync(path.resolve('mkdir'));
		});
		afterEach(function () {
			rimraf.sync(path.resolve('mkdir'));
		});
		describe('async', function () {
			it('should create a directory', function (done) {
				mkdir(path.resolve('mkdir', 'test'), function (err) {
					fs.existsSync(path.resolve('mkdir', 'test')).should.be.true;
					done();
				});
			});
			it('should create a nested directory', function (done) {
				mkdir(path.resolve('mkdir', 'test', 'test', 'test'), function (err) {
					fs.existsSync(path.resolve('mkdir', 'test', 'test', 'test')).should.be.true;
					done();
				});
			});
			it('should create a directory when passed a file', function (done) {
				mkdir(path.resolve('mkdir', 'test', 'test.txt'), function (err) {
					fs.existsSync(path.resolve('mkdir', 'test')).should.be.true;
					done();
				});
			});
		});
		describe('sync', function () {
			it('should create a directory', function () {
				mkdir.sync(path.resolve('mkdir', 'test'));
				fs.existsSync(path.resolve('mkdir', 'test')).should.be.true;
			});
			it('should create a nested directory', function () {
				mkdir.sync(path.resolve('mkdir', 'test', 'test', 'test'));
				fs.existsSync(path.resolve('mkdir', 'test', 'test', 'test')).should.be.true;
			});
			it('should create a directory when passed a file', function () {
				mkdir.sync(path.resolve('mkdir', 'test', 'test.txt'));
				fs.existsSync(path.resolve('mkdir', 'test')).should.be.true;
			});
		});
	});

	describe('mv', function () {
		beforeEach(function () {
			fs.mkdirSync(path.resolve('mv'));
		});
		afterEach(function () {
			rimraf.sync(path.resolve('mv'));
		});
		describe('async', function () {
			it('should move a file to an existing directory', function (done) {
				fs.mkdirSync(path.resolve('mv', 'test'));
				fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
				mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function (err, filepath) {
					fs.existsSync(path.resolve('mv', 'test.txt')).should.be.false;
					fs.existsSync(path.resolve('mv', 'test', 'test.txt')).should.be.true;
					done();
				});
			});
			it('should move a nested file to an existing directory', function (done) {
				fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
				mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function (err, filepath) {
					fs.existsSync(path.resolve('mv', 'test.txt')).should.be.false;
					fs.existsSync(path.resolve('mv', 'test', 'test.txt')).should.be.true;
					done();
				});
			});
			it('should return the path to the moved file', function (done) {
				fs.mkdirSync(path.resolve('mv', 'test'));
				fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
				mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function (err, filepath) {
					filepath.should.eql(path.resolve('mv', 'test', 'test.txt'));
					done();
				});
			});
			it('should not return an error when moving a file to a location with an existing file of the same name', function (done) {
				fs.mkdirSync(path.resolve('mv', 'test'));
				fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
				fs.writeFileSync(path.resolve('mv', 'test', 'test.txt'), 'blah', 'utf8');
				mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function (err, filepath) {
					should.not.exist(err);
					fs.existsSync(path.resolve('mv', 'test.txt')).should.be.true;
					done();
				});
			});
			it('should ovewrite when moving a file to a location with an existing file of the same name and force=true', function (done) {
				fs.mkdirSync(path.resolve('mv', 'test'));
				fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
				fs.writeFileSync(path.resolve('mv', 'test', 'test.txt'), 'blah blah', 'utf8');
				mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), true, function (err, filepath) {
					should.not.exist(err);
					fs.existsSync(path.resolve('mv', 'test', 'test.txt')).should.be.true;
					fs.readFileSync(path.resolve('mv', 'test', 'test.txt'), 'utf8').should.eql('blah');
					done();
				});
			});
		});
		describe('sync', function () {
			it('should move a file to an existing directory', function () {
				fs.mkdirSync(path.resolve('mv', 'test'));
				fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
				mv.sync(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false);
				fs.existsSync(path.resolve('mv', 'test.txt')).should.be.false;
				fs.existsSync(path.resolve('mv', 'test', 'test.txt')).should.be.true;
			});
			it('should move a nested file to an existing directory', function () {
				fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
				mv.sync(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false);
				fs.existsSync(path.resolve('mv', 'test.txt')).should.be.false;
				fs.existsSync(path.resolve('mv', 'test', 'test.txt')).should.be.true;
			});
			it('should return the path to the moved file', function () {
				fs.mkdirSync(path.resolve('mv', 'test'));
				fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
				var filepath = mv.sync(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false);
				filepath.should.eql(path.resolve('mv', 'test', 'test.txt'));
			});
			it('should not return an error when moving a file to a location with an existing file of the same name', function () {
				fs.mkdirSync(path.resolve('mv', 'test'));
				fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
				fs.writeFileSync(path.resolve('mv', 'test', 'test.txt'), 'blah', 'utf8');
				mv.sync(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false);
				fs.existsSync(path.resolve('mv', 'test.txt')).should.be.true;
			});
			it('should ovewrite when moving a file to a location with an existing file of the same name and force=true', function () {
				fs.mkdirSync(path.resolve('mv', 'test'));
				fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
				fs.writeFileSync(path.resolve('mv', 'test', 'test.txt'), 'blah blah', 'utf8');
				mv.sync(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), true);
				fs.existsSync(path.resolve('mv', 'test', 'test.txt')).should.be.true;
				fs.readFileSync(path.resolve('mv', 'test', 'test.txt'), 'utf8').should.eql('blah');
			});
		});
	});

	describe('rm', function () {
		beforeEach(function () {
			fs.mkdirSync(path.resolve('rm'));
		});
		afterEach(function () {
			rimraf.sync(path.resolve('rm'));
		});
		describe('async', function () {
			it('should remove a file in the project path', function (done) {
				fs.writeFileSync(path.resolve('rm', 'test.txt'), 'blah', 'utf8');
				rm(path.resolve('rm', 'test.txt'), function (err) {
					fs.existsSync(path.resolve('rm', 'test.txt')).should.be.false;
					done();
				});
			});
			it('should return an error when attempting to remove a file outside the project path', function (done) {
				rm(path.resolve('..', 'dummy'), function (err) {
					should.exist(err);
					fs.existsSync(path.resolve('..', 'dummy')).should.be.true;
					done();
				});
			});
			it('should return an error when attempting to remove a file that does not exist', function (done) {
				rm(path.resolve('rm', 'dummy'), function (err) {
					should.exist(err);
					done();
				});
			});
		});
		describe('sync', function () {
			it('should remove a file in the project path', function () {
				fs.writeFileSync(path.resolve('rm', 'test.txt'), 'blah', 'utf8');
				rm.sync(path.resolve('rm', 'test.txt'));
				fs.existsSync(path.resolve('rm', 'test.txt')).should.be.false;
			});
			it('should return an error when attempting to remove a file outside the project path', function () {
				try {
					rm.sync(path.resolve('..', 'dummy'));
				} catch (err) {
					should.exist(err);
					fs.existsSync(path.resolve('..', 'dummy')).should.be.true;
				}
			});
			it('should return an error when attempting to remove a file that does not exist', function () {
				try {
					rm.sync(path.resolve('rm', 'dummy'));
				} catch (err) {
					should.exist(err);
				}
			});
		});
	});

	describe('cp', function () {
		before(function () {
			process.chdir(path.resolve('cp'));
			fs.mkdirSync(path.resolve('test'));
		});
		after(function () {
			rimraf.sync(path.resolve('test'));
			process.chdir(path.resolve('..'));
		});
		describe('async', function () {
			it('should copy a file from one directory to another directory', function (done) {
				cp(path.resolve('main.js'), path.resolve('test'), false, function (err, filepath) {
					fs.existsSync(path.resolve('test', 'main.js')).should.be.true
					done()
				});
			});
			it('should copy a file from one directory to a new file name in another directory', function (done) {
				cp(path.resolve('main.js'), path.resolve('test', 'test.js'), false, function (err, filepath) {
					fs.existsSync(path.resolve('test', 'test.js')).should.be.true;
					done();
				});
			});
			it('should copy a file to a new file in the same directory with a new name', function (done) {
				cp(path.resolve('test', 'main.js'), path.resolve('test', 'test2.js'), false, function (err, filepath) {
					fs.existsSync(path.resolve('test', 'test2.js')).should.be.true;
					done();
				});
			});
			it('should not return an error when copying a file to the same directory without a new name', function (done) {
				cp(path.resolve('test', 'main.js'), path.resolve('test'), false, function (err, filepath) {
					should.not.exist(err);
					done();
				});
			});
			it('should copy a directory and it\'s contents from one directory to another directory', function (done) {
				cp(path.resolve('package'), path.resolve('test'), false, function (err, filepath) {
					fs.existsSync(path.resolve('test', 'package')).should.be.true;
					done();
				});
			});
			it('should only copy the contents of a directory when the source contains a trailing "/"', function (done) {
				cp(path.resolve('package') + path.sep, path.resolve('test'), false, function (err, filepath) {
					fs.existsSync(path.resolve('test', 'Class.js')).should.be.true;
					fs.existsSync(path.resolve('test', 'ClassCamelCase.js')).should.be.true;
					done();
				});
			});
			it('should return an error when copying a directory to a file', function (done) {
				cp(path.resolve('package'), path.resolve('test', 'main.js'), false, function (err, filepath) {
					should.exist(err);
					done();
				});
			});
		});
		describe('sync', function () {
			it('should copy a file from one directory to another directory', function () {
				cp.sync(path.resolve('main.js'), path.resolve('test'), false);
				fs.existsSync(path.resolve('test', 'main.js')).should.be.true
			});
			it('should copy a file from one directory to a new file name in another directory', function () {
				cp.sync(path.resolve('main.js'), path.resolve('test', 'test.js'), false);
				fs.existsSync(path.resolve('test', 'test.js')).should.be.true;
			});
			it('should copy a file to a new file in the same directory with a new name', function () {
				cp.sync(path.resolve('test', 'main.js'), path.resolve('test', 'test2.js'));
				fs.existsSync(path.resolve('test', 'test2.js')).should.be.true;
			});
			it('should not return an error when copying a file to the same directory without a new name', function () {
				try {
					cp.sync(path.resolve('main.js'), process.cwd(), false);
				} catch (err) {
					should.not.exist(err);
				}
			});
			it('should copy a directory and it\'s contents from one directory to another directory', function () {
				cp.sync(path.resolve('package'), path.resolve('test'), false);
				fs.existsSync(path.resolve('test', 'package')).should.be.true;
			});
			it('should only copy the contents of a directory when the source contains a trailing "/"', function () {
				cp.sync(path.resolve('package') + path.sep, path.resolve('test'), false);
				fs.existsSync(path.resolve('test', 'Class.js')).should.be.true;
				fs.existsSync(path.resolve('test', 'ClassCamelCase.js')).should.be.true;
			});
			it('should return an error when copying a directory to a file', function () {
				try {
					cp.sync(path.resolve('package'), path.resolve('test', 'main.js'), false);
					should.not.be.ok();
				} catch (err) {
					should.exist(err);
				}
			});
		});
	});

	describe('walk', function () {
		describe('async', function () {
			it('should visit all resources of a directory and it\'s parents', function (done) {
				var visits = 0;
				walk(path.resolve('readdir-nested/src/package'), function (resource, stat, next) {
					if (~resource.indexOf('.js')) visits++;
					next(path.basename(path.dirname(resource)) == 'fixtures');
				}, function (err) {
					visits.should.equal(4);
					done();
				});
			});
			it('should allow for early termination', function (done) {
				var visits = 0;
				walk('readdir-nested/src/package', function (resource, stat, next) {
					if (~resource.indexOf('.js')) visits++;
					next(true);
				}, function (err) {
					visits.should.equal(1);
					done();
				});
			});
		});

		describe('sync', function () {
			it('should visit all resources of a directory and it\'s parents', function () {
				var visits = 0;
				walk.sync(path.resolve('readdir-nested/src/package'), function (resource, stat) {
					if (resource.indexOf(process.cwd()) == 0 && ~resource.indexOf('.js')) visits++;
				});
				visits.should.equal(4);
			});
		});
	});

	describe('hunt', function () {
		describe('async', function () {
			it('should return all files matched with a matcher function', function (done) {
				hunt(path.resolve('readdir-nested/src/package'), function (resource, stat, next) {
					next(~resource.indexOf('ClassCamelCase.js'));
				}, false, function (err, matches) {
					matches.should.have.length(1);
					done();
				});
			});
			it('should return all files matched with a matcher glob string', function (done) {
				hunt(path.resolve('readdir-nested/src/package'), 'Class*.js', false, function (err, matches) {
					matches.should.have.length(2);
					done();
				});
			});
			it('should return the first file matched when options.stopOnFirst is true', function (done) {
				hunt(path.resolve('readdir-nested/src/package'), 'Class*.js', true, function (err, matches) {
					matches.should.equal(path.resolve('readdir-nested/src/package/Class.js'));
					done();
				});
			});
			it('should allow for early termination when using a matcher function', function (done) {
				hunt(path.resolve('readdir-nested/src/package'), function (resource, stat, next) {
					next(~resource.indexOf('.js'), true);
				}, false, function (err, matches) {
					matches.should.have.length(1);
					done();
				});
			});
		});

		describe('sync', function () {
			it('should return all files matched with a matcher function', function () {
				var matches = hunt.sync(path.resolve('readdir-nested/src/package'), function (resource, stat) {
					return ~resource.indexOf('ClassCamelCase.js');
				});
				matches.should.have.length(1);
			});
			it('should return all files matched with a matcher glob string', function () {
				var matches = hunt.sync(path.resolve('readdir-nested/src/package'), 'Class*.js');
				matches.should.have.length(2);
			});
			it('should return the first file matched when options.stopOnFirst is true', function () {
				var matches = hunt.sync(path.resolve('readdir-nested/src/package'), 'Class*.js', { stopOnFirst: true });
				matches.should.equal(path.resolve('readdir-nested/src/package/Class.js'));
			});
		});
	});
});