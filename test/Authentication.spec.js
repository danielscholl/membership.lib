/* jshint -W024, -W101, -W079, -W098 */
/* jshint expr:true */
'use strict';

var should = require('chai').should();
var assert = require('assert');
var db = require('mongoDAL');
var userService = require('UserService.lib');
var RegistrationService = require('../lib/Registration.service.js');
var AuthenticationService = require('../lib/Authentication.service.js');
var config = require('./config.json');

describe('Authentication', function() {
  var registration = new RegistrationService(config);
  var authentication = new AuthenticationService(config);
  var request = {};
  request.email = 'test@mail.com';
  request.password = 'password';
  request.confirm = 'password';
  var user = null;

  before(function(done) {
    db.connect(config.mongo, function(err,db){
      assert.ok(db, err);
      db.dropDb(config.mongo.db, function(){
        db.install(['users'], function(){
          registration.applyForMembership(request, function(err, result) {
            user = result.data;
            done();
          });
        });
      });
    });
  });

  describe('A good login attempt', function() {
    var goodUser, credentials = null;
    var request2 = {};
    request2.email = 'good@mail.com';
    request2.password = 'password';
    request2.confirm = 'password';

    before(function(done) {
      credentials = {};
      userService.setup(config);
      registration.applyForMembership(request2, function(err, result) {
        goodUser = result.data;
        goodUser.status = 'ACTIVE';
        userService.update(goodUser, function(err, result) {
          done();
        });
        user = result.data;
      });
    });

    it('Should be a success with userName and Password', function(done) {
      credentials.userName = request2.email;
      credentials.password = request2.password;
      authentication.login(credentials, function(err, result) {
        result.success.should.be.true;
        result.message.should.be.equal('All Good');
        goodUser = result.data;
        done();
      });
    });

    it('Should be a success with token', function(done) {
      authentication.token(goodUser.token, function(err, result) {
        result.success.should.be.true;
        result.message.should.be.equal('All Good');
        done();
      });
    });

    it('Defines a Property Id', function(done) {
      (goodUser.id === null).should.be.false;
      done();
    });
    it('Defines a Property UserName', function(done) {
      goodUser.should.have.property('userName', request2.email);
      done();
    });
    it('Defines a Property Token', function(done) {
      goodUser.should.have.property('token', request2.token);
      done();
    });


  });

  describe('A bad login attempt', function() {
    var credentials = null;

    beforeEach(function(done) {
      credentials = {};
      done();
    });

    it('should fail with no data', function(done) {
      authentication.login(null, function(err, result) {
        result.success.should.be.false;
        result.message.should.be.equal('userName and password are required');
        done();
      });
    });

    it('should fail with no user', function(done) {
      credentials.password = request.password;
      authentication.login(credentials, function(err, result) {
        result.success.should.be.false;
        result.message.should.be.equal('userName and password are required');
        done();
      });
    });

    it('should fail with no password', function(done) {
      credentials.userName = request.email;
      authentication.login(credentials, function(err, result) {
        result.success.should.be.false;
        result.message.should.be.equal('userName and password are required');
        done();
      });
    });

    it('should fail with an invalid password', function(done) {
      credentials.userName = request.email;
      credentials.password = 'password_bad';
      authentication.login(credentials, function(err, result) {
        result.success.should.be.false;
        result.message.should.be.equal('invalid user');
        done();
      });
    });

    it('should fail with a not found user', function(done) {
      credentials.userName = 'test2@mail.com';
      credentials.password = 'password_bad';
      authentication.login(credentials, function(err, result) {
        result.success.should.be.false;
        result.message.should.be.equal('invalid user');
        done();
      });
    });

    it('should fail with a non active user', function(done) {
      credentials.userName = request.email;
      credentials.password = request.password;
      authentication.login(credentials, function(err, result) {
        result.success.should.be.false;
        result.message.should.be.equal('user not active');
        done();
      });
    });

    it('Should be a failure with a bad token', function(done) {
      authentication.token('12345', function(err, result) {
        result.success.should.be.false;
        result.message.should.be.equal('invalid token');
        done();
      });
    });
  });



});
