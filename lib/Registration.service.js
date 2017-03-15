'use strict';

var Emitter = require('events').EventEmitter;
var util = require('util');
var Verror = require('verror');
var log = require('debug')('Membership');
var jwt = require('jsonwebtoken');
var userService = require('UserService.lib');
var Response = require('./ServiceResult.model');
var Application = require('./Application');
var User = require('./user.model');

var RegistrationService = function(config) {
  Emitter.call(this);
  var self = this;
  var continueWith = null;
  var expires = {expiresInMinutes: 60*5};

  // Validate Service Input
  if(!config) {
    config = {};
  }

  if(!config.mongo) {
    config.mongo = {};
    config.mongo.url = process.env.MONGO_URL || 'mongodb://localhost:27017/local';
  }

  if(!config.secrets) {
    config.secrets = {};
    config.secrets.session = process.env.JWT_SECRET || 'jwt-secret';
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

  // Make sure there is an email and password input
  var validateInputs = function(app) {
    var error = new Verror(null, 'Registration Validation');

    if(!app.email || !app.password) {
      self.emit('send-error', error, 'Email and Password are required');
    } else if(app.password !== app.confirm) {
      self.emit('send-error', error, 'Passwords do not match');
    } else{
      app.setValid('Validation Success');
      self.emit('create-user', app);
    }
  };

  // Save the User to the Database.
  var createUser = function(app){
    var user = new User(app);
    var data = {id: user.id, email: user.email};
    user.token = jwt.sign(data, config.secrets.session, expires);

    userService.setup(config, User);
    userService.create(user, function(err, result) {
      if(err !== null) {
        var error = new Verror(err, 'Creating User Service');
        log('FAILED: ' + app + ' - ' + JSON.stringify(err, null, 2));
        self.emit('send-error', error);
      } else {
        self.emit('send-data', result);
      }
    });
  };

  // Happy
  // 1) Validate
  // 2) Create

  /////////////////////////////////////////

  //  Exposed Registration Method
  self.applyForMembership = function(args, next){
    continueWith = next;
    var app = new Application(args);
    self.emit('validate-inputs', app);
  };


  // Event Wireup
  self.on('send-data', sendData);
  self.on('send-error', sendError);
  self.on('validate-inputs', validateInputs);
  self.on('create-user', createUser);

  return self;
};

util.inherits(RegistrationService,Emitter);
module.exports = RegistrationService;
