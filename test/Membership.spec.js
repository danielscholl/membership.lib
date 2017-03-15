/* jshint -W024, -W101, -W079, -W098 */
/* jshint expr:true */
'use strict';

var should = require('chai').should();
var Membership = require('../lib/Membership.js');
var config = require('./config.json');

describe('Membership', function() {

  before(function(done) {
    done();
  });

  describe('Good or Bad', function() {
    var membership = new Membership(config);

    it('Should give a good response', function(done) {
      membership.good('Good', function(err, result) {
        (err === null).should.be.true;
        result.success.should.be.true;
        done();
      });
    });
    it('Should give a bad response', function(done) {
      membership.bad('Failure State Occured', function(err, result) {
        (err === null).should.be.true;
        result.success.should.be.false;
        done();
      });
    });

  });
});
