'use strict';

var Emitter = require('events').EventEmitter;
var util = require('util');
var Verror = require('verror');
var log = require('debug')('Membership');
var Response = require('./serviceResult.model');

var Membership = function(config) {
  Emitter.call(this);
  var self = this;
  var continueWith = null;


  // Validate Service Input
  if(!config) {
    config = {};
    config.sample = process.env.sample || 'sample';
  }

  // Create an Okay Result
  var sendData = function(data) {
    var result = new Response();
    result.success = true;
    result.message = 'All Good';
    result.data = data;

    if(continueWith) {
      continueWith(null, result);
    }
  };

  // Create a Bad Result
  var sendError = function(err, message) {
    var result = new Response();
    result.success = false;
    result.message = message;
    if(err) {
      var error = new Verror(err, message);
      log('Failure: ' + JSON.stringify(error, null, 2));
    }
    if(continueWith) {
      continueWith(null, result);
    }
  };

  // Do Something
  var doSomething = function(err, result) {
    if(err) {
      self.emit('send-error', err, 'Do Something Failure');
    } else {
      self.emit('send-data', result);
    }
  };

  /////////////////////////////////////////

  self.good = function(input, done) {
    continueWith = done;
    doSomething(null, input);
  };

  self.bad = function(input, done) {
    continueWith = done;
    doSomething(input, null);
  };

  // Event Wireup
  self.on('send-data', sendData);
  self.on('send-error', sendError);

  return self;
};

util.inherits(Membership,Emitter);
module.exports = Membership;
