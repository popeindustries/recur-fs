var path = require('path')
  , fs = require('fs')
  , expect = require('expect.js')
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
      expect(indir('/some/directory', '/some/directory/file.js')).to.be.true;
      expect(indir('/some/directory', '/some/directory/nested/file.js')).to.be.true;
    });
    it('should return false when checking a filepath that does not reside in a directory', function () {
      expect(indir('/some/directory', '/another/directory/file.js')).to.be.false;
      expect(indir('/some/directory', '/some/other/directory/file.js')).to.be.false;
    });
    it('should return false when passed a directory of "null"', function () {
      expect(indir(null, '/another/directory/file.js')).to.be.false;
    });
  });

  describe('readdir', function () {
    describe('async', function () {
      it('should return an empty array for a nonexistant directory', function (done) {
        readdir('foo', function (err, resources) {
          expect(resources).to.have.length(0);
          done()
        });
      });
      it('should read the contents of a flat directory', function (done) {
        readdir(path.resolve('readdir-simple'), function (err, resources) {
          expect((resources.length >= 4)).to.be.true;
          done();
        });
      });
      it('should read the contents of a nested directory', function (done) {
        readdir(path.resolve('readdir-nested'), function (err, resources) {
          expect((resources.length >= 6)).to.be.true;
          done();
        });
      });
      it('should call a passed visitor function for each resource', function (done) {
        var files = [];
        readdir(path.resolve('readdir-simple'), function (resource, stat, next) {
          if (stat.isFile()) files.push(resource);
          next();
        }, function (err, resources) {
          expect(files).to.have.length(4);
          done();
        });
      });
      it('should skip resources if a passed visitor function returns "false"', function (done) {
        readdir(path.resolve('readdir-simple'), function (resource, stat, next) {
          next(false);
        }, function (err, resources) {
          expect(resources).to.have.length(0);
          done();
        });
      });
    });
    describe('sync', function () {
      it('should return an empty array for a nonexistant directory', function () {
        var resources = readdir.sync('foo');
      });
      it('should read the contents of a flat directory', function () {
        var resources = readdir.sync(path.resolve('readdir-simple'));
        expect((resources.length >= 4)).to.be.true;
      });
      it('should read the contents of a nested directory', function () {
        var resources = readdir.sync(path.resolve('readdir-nested'));
        expect((resources.length >= 6)).to.be.true;
      });
      it('should call a passed visitor function for each resource', function () {
        var files = [];
        readdir.sync(path.resolve('readdir-simple'), function (resource, stat) {
          if (stat.isFile()) files.push(resource);
        });
        expect(files).to.have.length(4);
      });
      it('should skip resources if a passed visitor function returns "false"', function () {
        var resources = readdir.sync(path.resolve('readdir-simple'), function (resource, stat) {
          return false;
        });
        expect(resources).to.have.length(0);
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
          expect(fs.existsSync(path.resolve('mkdir', 'test'))).to.be.true;
          done();
        });
      });
      it('should create a nested directory', function (done) {
        mkdir(path.resolve('mkdir', 'test', 'test', 'test'), function (err) {
          expect(fs.existsSync(path.resolve('mkdir', 'test', 'test', 'test'))).to.be.true;
          done();
        });
      });
      it('should create a directory when passed a file', function (done) {
        mkdir(path.resolve('mkdir', 'test', 'test.txt'), function (err) {
          expect(fs.existsSync(path.resolve('mkdir', 'test'))).to.be.true;
          done();
        });
      });
    });
    describe('sync', function () {
      it('should create a directory', function () {
        mkdir.sync(path.resolve('mkdir', 'test'));
        expect(fs.existsSync(path.resolve('mkdir', 'test'))).to.be.true;
      });
      it('should create a nested directory', function () {
        mkdir.sync(path.resolve('mkdir', 'test', 'test', 'test'));
        expect(fs.existsSync(path.resolve('mkdir', 'test', 'test', 'test'))).to.be.true;
      });
      it('should create a directory when passed a file', function () {
        mkdir.sync(path.resolve('mkdir', 'test', 'test.txt'));
        expect(fs.existsSync(path.resolve('mkdir', 'test'))).to.be.true;
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
          expect(fs.existsSync(path.resolve('mv', 'test.txt'))).to.be.false;
          expect(fs.existsSync(path.resolve('mv', 'test', 'test.txt'))).to.be.true;
          done();
        });
      });
      it('should move a nested file to an existing directory', function (done) {
        fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
        mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function (err, filepath) {
          expect(fs.existsSync(path.resolve('mv', 'test.txt'))).to.be.false;
          expect(fs.existsSync(path.resolve('mv', 'test', 'test.txt'))).to.be.true;
          done();
        });
      });
      it('should return the path to the moved file', function (done) {
        fs.mkdirSync(path.resolve('mv', 'test'));
        fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
        mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function (err, filepath) {
          expect(filepath).to.eql(path.resolve('mv', 'test', 'test.txt'));
          done();
        });
      });
      it('should not return an error when moving a file to a location with an existing file of the same name', function (done) {
        fs.mkdirSync(path.resolve('mv', 'test'));
        fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
        fs.writeFileSync(path.resolve('mv', 'test', 'test.txt'), 'blah', 'utf8');
        mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false, function (err, filepath) {
          expect(err).to.not.be.ok();
          expect(fs.existsSync(path.resolve('mv', 'test.txt'))).to.be.true;
          done();
        });
      });
      it('should ovewrite when moving a file to a location with an existing file of the same name and force=true', function (done) {
        fs.mkdirSync(path.resolve('mv', 'test'));
        fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
        fs.writeFileSync(path.resolve('mv', 'test', 'test.txt'), 'blah blah', 'utf8');
        mv(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), true, function (err, filepath) {
          expect(err).to.not.be.ok();
          expect(fs.existsSync(path.resolve('mv', 'test', 'test.txt'))).to.be.true;
          expect(fs.readFileSync(path.resolve('mv', 'test', 'test.txt'), 'utf8')).to.eql('blah');
          done();
        });
      });
    });
    describe('sync', function () {
      it('should move a file to an existing directory', function () {
        fs.mkdirSync(path.resolve('mv', 'test'));
        fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
        mv.sync(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false);
        expect(fs.existsSync(path.resolve('mv', 'test.txt'))).to.be.false;
        expect(fs.existsSync(path.resolve('mv', 'test', 'test.txt'))).to.be.true;
      });
      it('should move a nested file to an existing directory', function () {
        fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
        mv.sync(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false);
        expect(fs.existsSync(path.resolve('mv', 'test.txt'))).to.be.false;
        expect(fs.existsSync(path.resolve('mv', 'test', 'test.txt'))).to.be.true;
      });
      it('should return the path to the moved file', function () {
        fs.mkdirSync(path.resolve('mv', 'test'));
        fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
        var filepath = mv.sync(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false);
        expect(filepath).to.eql(path.resolve('mv', 'test', 'test.txt'));
      });
      it('should not return an error when moving a file to a location with an existing file of the same name', function () {
        fs.mkdirSync(path.resolve('mv', 'test'));
        fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
        fs.writeFileSync(path.resolve('mv', 'test', 'test.txt'), 'blah', 'utf8');
        mv.sync(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), false);
        expect(fs.existsSync(path.resolve('mv', 'test.txt'))).to.be.true;
      });
      it('should ovewrite when moving a file to a location with an existing file of the same name and force=true', function () {
        fs.mkdirSync(path.resolve('mv', 'test'));
        fs.writeFileSync(path.resolve('mv', 'test.txt'), 'blah', 'utf8');
        fs.writeFileSync(path.resolve('mv', 'test', 'test.txt'), 'blah blah', 'utf8');
        mv.sync(path.resolve('mv', 'test.txt'), path.resolve('mv', 'test'), true);
        expect(fs.existsSync(path.resolve('mv', 'test', 'test.txt'))).to.be.true;
        expect(fs.readFileSync(path.resolve('mv', 'test', 'test.txt'), 'utf8')).to.eql('blah');
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
          expect(fs.existsSync(path.resolve('rm', 'test.txt'))).to.be.false;
          done();
        });
      });
      it('should return an error when attempting to remove a file outside the project path', function (done) {
        rm(path.resolve('..', 'dummy'), function (err) {
          expect(err).to.be.an(Error);
          expect(fs.existsSync(path.resolve('..', 'dummy'))).to.be.true;
          done();
        });
      });
      it('should return an error when attempting to remove a file that does not exist', function (done) {
        rm(path.resolve('rm', 'dummy'), function (err) {
          expect(err).to.be.an(Error);
          done();
        });
      });
    });
    describe('sync', function () {
      it('should remove a file in the project path', function () {
        fs.writeFileSync(path.resolve('rm', 'test.txt'), 'blah', 'utf8');
        rm.sync(path.resolve('rm', 'test.txt'));
        expect(fs.existsSync(path.resolve('rm', 'test.txt'))).to.be.false;
      });
      it('should return an error when attempting to remove a file outside the project path', function () {
        try {
          rm.sync(path.resolve('..', 'dummy'));
        } catch (err) {
          expect(err).to.be.an(Error);
          expect(fs.existsSync(path.resolve('..', 'dummy'))).to.be.true;
        }
      });
      it('should return an error when attempting to remove a file that does not exist', function () {
        try {
          rm.sync(path.resolve('rm', 'dummy'));
        } catch (err) {
          expect(err).to.be.an(Error);
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
          expect(fs.existsSync(path.resolve('test', 'main.js'))).to.be.true
          done()
        });
      });
      it('should copy a file from one directory to a new file name in another directory', function (done) {
        cp(path.resolve('main.js'), path.resolve('test', 'test.js'), false, function (err, filepath) {
          expect(fs.existsSync(path.resolve('test', 'test.js'))).to.be.true;
          done();
        });
      });
      it('should copy a file to a new file in the same directory with a new name', function (done) {
        cp(path.resolve('test', 'main.js'), path.resolve('test', 'test2.js'), false, function (err, filepath) {
          expect(fs.existsSync(path.resolve('test', 'test2.js'))).to.be.true;
          done();
        });
      });
      it('should not return an error when copying a file to the same directory without a new name', function (done) {
        cp(path.resolve('test', 'main.js'), path.resolve('test'), false, function (err, filepath) {
          expect(err).to.not.be.ok();
          done();
        });
      });
      it('should copy a directory and it\'s contents from one directory to another directory', function (done) {
        cp(path.resolve('package'), path.resolve('test'), false, function (err, filepath) {
          expect(fs.existsSync(path.resolve('test', 'package'))).to.be.true;
          done();
        });
      });
      it('should only copy the contents of a directory when the source contains a trailing "/"', function (done) {
        cp(path.resolve('package') + path.sep, path.resolve('test'), false, function (err, filepath) {
          expect(fs.existsSync(path.resolve('test', 'Class.js'))).to.be.true;
          expect(fs.existsSync(path.resolve('test', 'ClassCamelCase.js'))).to.be.true;
          done();
        });
      });
      it('should return an error when copying a directory to a file', function (done) {
        cp(path.resolve('package'), path.resolve('test', 'main.js'), false, function (err, filepath) {
          expect(err).to.be.an(Error);
          done();
        });
      });
    });
    describe('sync', function () {
      it('should copy a file from one directory to another directory', function () {
        cp.sync(path.resolve('main.js'), path.resolve('test'), false);
        expect(fs.existsSync(path.resolve('test', 'main.js'))).to.be.true
      });
      it('should copy a file from one directory to a new file name in another directory', function () {
        cp.sync(path.resolve('main.js'), path.resolve('test', 'test.js'), false);
        expect(fs.existsSync(path.resolve('test', 'test.js'))).to.be.true;
      });
      it('should copy a file to a new file in the same directory with a new name', function () {
        cp.sync(path.resolve('test', 'main.js'), path.resolve('test', 'test2.js'));
        expect(fs.existsSync(path.resolve('test', 'test2.js'))).to.be.true;
      });
      it('should not return an error when copying a file to the same directory without a new name', function () {
        try {
          cp.sync(path.resolve('main.js'), process.cwd(), false);
        } catch (err) {
          expect(err).to.not.be.ok();
        }
      });
      it('should copy a directory and it\'s contents from one directory to another directory', function () {
        cp.sync(path.resolve('package'), path.resolve('test'), false);
        expect(fs.existsSync(path.resolve('test', 'package'))).to.be.true;
      });
      it('should only copy the contents of a directory when the source contains a trailing "/"', function () {
        cp.sync(path.resolve('package') + path.sep, path.resolve('test'), false);
        expect(fs.existsSync(path.resolve('test', 'Class.js'))).to.be.true;
        expect(fs.existsSync(path.resolve('test', 'ClassCamelCase.js'))).to.be.true;
      });
      it('should return an error when copying a directory to a file', function () {
        try {
          cp.sync(path.resolve('package'), path.resolve('test', 'main.js'), false);
          expect(false).to.not.be.ok();
        } catch (err) {
          expect(err).to.be.an(Error);
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
          expect(visits).to.equal(4);
          done();
        });
      });
      it('should allow for early termination', function (done) {
        var visits = 0;
        walk('readdir-nested/src/package', function (resource, stat, next) {
          if (~resource.indexOf('.js')) visits++;
          next(true);
        }, function (err) {
          expect(visits).to.equal(1);
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
        expect(visits).to.equal(4);
      });
      it('should allow for early termination', function () {
        var visits = 0;
        walk.sync(path.resolve('readdir-nested/src/package'), function (resource, stat) {
          if (~resource.indexOf('.js')) visits++;
          return true;
        });
        expect(visits).to.equal(1);
      });
    });
  });

  describe('hunt', function () {
    describe('async', function () {
      it('should return all files matched with a matcher function', function (done) {
        hunt(path.resolve('readdir-nested/src/package'), function (resource, stat, next) {
          next(~resource.indexOf('ClassCamelCase.js'));
        }, false, function (err, matches) {
          expect(matches).to.have.length(1);
          done();
        });
      });
      it('should return all files matched with a matcher glob string', function (done) {
        hunt(path.resolve('readdir-nested/src/package'), 'Class*.js', false, function (err, matches) {
          expect(matches).to.have.length(2);
          done();
        });
      });
      it('should return the first file matched when options.stopOnFirst is true', function (done) {
        hunt(path.resolve('readdir-nested/src/package'), 'Class*.js', true, function (err, matches) {
          expect(matches).to.equal(path.resolve('readdir-nested/src/package/Class.js'));
          done();
        });
      });
      it('should allow for early termination when using a matcher function', function (done) {
        hunt(path.resolve('readdir-nested/src/package'), function (resource, stat, next) {
          next(~resource.indexOf('.js'), true);
        }, false, function (err, matches) {
          expect(matches).to.have.length(1);
          done();
        });
      });
    });

    describe('sync', function () {
      it('should return all files matched with a matcher function', function () {
        var matches = hunt.sync(path.resolve('readdir-nested/src/package'), function (resource, stat) {
          return ~resource.indexOf('ClassCamelCase.js');
        });
        expect(matches).to.have.length(1);
      });
      it('should return all files matched with a matcher glob string', function () {
        var matches = hunt.sync(path.resolve('readdir-nested/src/package'), 'Class*.js');
        expect(matches).to.have.length(2);
      });
      it('should return the first file matched when options.stopOnFirst is true', function () {
        var matches = hunt.sync(path.resolve('readdir-nested/src/package'), 'Class*.js', { stopOnFirst: true });
        expect(matches).to.equal(path.resolve('readdir-nested/src/package/Class.js'));
      });
    });
  });
});