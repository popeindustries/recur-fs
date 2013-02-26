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
	, cp = fsutils.cp;

describe('recur-fs', function() {
	before(function() {
		process.chdir(path.resolve(__dirname, 'fixtures'))
	});

	describe('indir', function() {
		it('should return true when checking a filepath that resides in a directory', function() {
			indir('/some/directory', '/some/directory/file.js').should.be.true;
			indir('/some/directory', '/some/directory/nested/file.js').should.be.true;
		});
		it('should return false when checking a filepath that does not reside in a directory', function() {
			indir('/some/directory', '/another/directory/file.js').should.be.false;
			indir('/some/directory', '/some/other/directory/file.js').should.be.false;
		});
	});

	describe('readdir', function() {
		it('should read the contents of a flat directory', function(done) {
			readdir(path.resolve('readdir-simple'), null, null, function(err, files, directories) {
				files.should.have.length(4);
				directories.should.have.length(1);
				done();
			});
		});
		it('should read the contents of a nested directory', function(done) {
			readdir(path.resolve('readdir-nested'), null, null, function(err, files, directories) {
				files.should.have.length(4);
				directories.should.have.length(3);
				done();
			});
		});
		it('should ignore files when an ignore pattern is passed', function(done) {
			readdir(path.resolve('readdir-simple'), null, /^Class/, function(err, files, directories) {
				files.should.have.length(2);
				directories.should.have.length(1);
				done();
			});
		});
		it('should include files when an include pattern is passed', function(done) {
			readdir(path.resolve('readdir-simple'), /^Class/, null, function(err, files, directories) {
				files.should.have.length(2);
				directories.should.have.length(1);
				done();
			});
		});
		it('should skip empty nested directories', function(done) {
			readdir(path.resolve('readdir-empty'), null, null, function(err, files, directories) {
				files.should.have.length(1);
				directories.should.have.length(2);
				done();
			});
		});
		it('should automatically ignore hidden files', function(done) {
			readdir(path.resolve('readdir-empty/empty'), null, null, function(err, files, directories) {
				files.should.have.length(0);
				directories.should.have.length(1);
				done();
			});
		});
	});

	describe('mkdir', function() {
		beforeEach(function() {
			fs.mkdirSync(path.resolve('mkdir'));
		});
		afterEach(function() {
			rimraf.sync(path.resolve('mkdir'));
		});
		it('should create a directory', function(done) {
			mkdir(path.resolve('mkdir', 'test'), function(err) {
				fs.existsSync(path.resolve('mkdir', 'test')).should.be.true;
				done();
			});
		});
		it('should create a nested directory', function(done) {
			mkdir(path.resolve('mkdir', 'test', 'test', 'test'), function(err) {
				fs.existsSync(path.resolve('mkdir', 'test', 'test', 'test')).should.be.true;
				done();
			});
		});
	});

	describe('mv', function() {
		beforeEach(function() {
			fs.mkdirSync(path.resolve('mv'));
		});
		afterEach(function() {
			rimraf.sync(path.resolve('mv'));
		});
		it('should move a file to an existing directory', function(done) {
			fs.mkdirSync(path.resolve('mv', 'test'));
			fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
			mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function(err, filepath) {
				fs.existsSync(path.resolve('mv', 'test.txt')).should.be.false;
				fs.existsSync(path.resolve('mv', 'test', 'test.txt')).should.be.true;
				done();
			});
		});
		it('should move a nested file to an existing directory', function(done) {
			fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
			mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function(err, filepath) {
				fs.existsSync(path.resolve('mv', 'test.txt')).should.be.false;
				fs.existsSync(path.resolve('mv', 'test', 'test.txt')).should.be.true;
				done();
			});
		});
		it('should return the path to the moved file', function(done) {
			fs.mkdirSync(path.resolve('mv', 'test'));
			fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
			mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function(err, filepath) {
				filepath.should.eql(path.resolve('mv', 'test', 'test.txt'));
				done();
			});
		});
		it('should not return an error when moving a file to a location with an existing file of the same name', function(done) {
			fs.mkdirSync(path.resolve('mv', 'test'));
			fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
			fs.writeFileSync(path.resolve('mv', 'test', 'test.txt'), 'blah', 'utf8');
			mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function(err, filepath) {
				should.not.exist(err);
				fs.existsSync(path.resolve('mv', 'test.txt')).should.be.true;
				done();
			});
		});
	});

	describe('rm', function() {
		beforeEach(function() {
			fs.mkdirSync(path.resolve('rm'));
		});
		afterEach(function() {
			rimraf.sync(path.resolve('rm'));
		});
		it('should remove a file in the project path', function(done) {
			fs.writeFileSync(path.resolve('rm', 'test.txt'), 'blah', 'utf8');
			rm(path.resolve('rm', 'test.txt'), function(err) {
				fs.existsSync(path.resolve('rm', 'test.txt')).should.be.false;
				done();
			});
		});
		it('should return an error when attempting to remove a file outside the project path', function(done) {
			rm(path.resolve('..', 'dummy'), function(err) {
				should.exist(err);
				fs.existsSync(path.resolve('..', 'dummy')).should.be.true;
				done();
			});
		});
		it('should return an error when attempting to remove a file that does not exist', function(done) {
			rm(path.resolve('rm', 'dummy'), function(err) {
				should.exist(err);
				done();
			});
		});
	});

	describe('cp', function() {
		before(function() {
			process.chdir(path.resolve('cp'));
			fs.mkdirSync(path.resolve('test'));
		});
		after(function() {
			rimraf.sync(path.resolve('test'));
			process.chdir(path.resolve('..'));
		});
		it('should copy a file from one directory to another directory', function(done) {
			cp(path.resolve('main.coffee'), path.resolve('test'), false, function(err, filepath) {
				fs.existsSync(path.resolve('test', 'main.coffee')).should.be.true
				done()
			});
		});
		it('should copy a file from one directory to a new file name in another directory', function(done) {
			cp(path.resolve('main.coffee'), path.resolve('test', 'test.coffee'), false, function(err, filepath) {
				fs.existsSync(path.resolve('test', 'test.coffee')).should.be.true;
				done();
			});
		});
		it('should copy a file to a new file in the same directory with a new name', function(done) {
			cp(path.resolve('test', 'main.coffee'), path.resolve('test', 'test2.coffee'), false, function(err, filepath) {
				fs.existsSync(path.resolve('test', 'test2.coffee')).should.be.true;
				done();
			});
		});
		it('should not return an error when copying a file to the same directory without a new name', function(done) {
			cp(path.resolve('test', 'main.coffee'), path.resolve('test'), false, function(err, filepath) {
				should.not.exist(err);
				done();
			});
		});
		it('should copy a directory and it\'s contents from one directory to another directory', function(done) {
			cp(path.resolve('package'), path.resolve('test'), false, function(err, filepath) {
				fs.existsSync(path.resolve('test', 'package')).should.be.true;
				done();
			});
		});
		it('should only copy the contents of a directory when the source contains a trailing "/"', function(done) {
			cp(path.resolve('package') + path.sep, path.resolve('test'), false, function(err, filepath) {
				fs.existsSync(path.resolve('test', 'Class.coffee')).should.be.true;
				fs.existsSync(path.resolve('test', 'ClassCamelCase.coffee')).should.be.true;
				done();
			});
		});
		it('should return an error when copying a directory to a file', function(done) {
			cp(path.resolve('package'), path.resolve('test', 'main.coffee'), false, function(err, filepath) {
				should.exist(err);
				done();
			});
		});
	});
});