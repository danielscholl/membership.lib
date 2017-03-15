/* jshint -W024, -W101, -W079, -W098 */
/* jshint expr:true */
'use strict';

var should = require('chai').should();
var assert = require('assert');
var db = require('mongoDAL');
var jwt = require('jsonwebtoken');
var RegistrationService = require('../lib/Registration.service.js');
var config = require('./config.json');

describe('Registration', function() {

  before(function(done) {
    db.connect(config.mongo, function(err,db){
      assert.ok(db, err);
      db.dropDb(config.mongo.db, function(){
        db.install(['users'], function(){
          done();
        });
      });
    });
  });

  describe('A Valid Application', function() {
    var registration = new RegistrationService(config);
    var request, response = null;
    request = {};
    request.email = 'test@mail.com';
    request.password = 'password';
    request.confirm = 'password';

    before(function(done){
      registration.applyForMembership(request, function(err, result) {
        response = result;
        done();
      });
    });

    it('creates a User and returns success', function() {
      response.success.should.equal(true);
    });
    it('sets the user status to new', function() {
      response.data.status.should.equal('NEW');
    });
    it('initiates the signInCount', function(){
      response.data.signInCount.should.equal(0);
    });
    it('sets a valid token', function(){
      (response.data.token === null).should.be.false;
      var decoded = jwt.decode(response.data.token, config.secrets.session);
      decoded.email.should.equal(response.data.email);
    });

  });
});
