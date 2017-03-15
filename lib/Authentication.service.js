'use strict';

var Emitter = require('events').EventEmitter;
var util = require('util');
var Verror = require('verror');
var log = require('debug')('membership:auth');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var userService = require('UserService.lib');
var Response = require('./ServiceResult.model');

var AuthResult = function(args){
  var result = {
    creds: args,
    message : 'Invalid User',
    user : null
  };

  return result;
};

var AuthenticationService = function(config) {
  Emitter.call(this);
  var self = this;
  var continueWith = null;

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
      log('Failure: ' + JSON.stringify(error.message, null, 2));
    }
    if(continueWith) {
      continueWith(null, result);
    }
  };

  // Make sure there is an email and password input
  var validateInputs = function(authResult) {
    var error = new Verror(null, 'Authentication Validation');

    if(!authResult.creds ||
       !authResult.creds.userName ||
       !authResult.creds.password) {
      self.emit('send-error', error, 'userName and password are required');
    } else {
      self.emit('get-User', authResult);
    }
  };

  var validateToken = function(authResult) {
    var error = new Verror(null, 'Authentication Validation');

    if(!authResult.creds) {
      self.emit('send-error', error, 'token is required');
    } else {
      self.emit('verify-token', authResult);
    }
  };

  var verifyToken = function(authResult) {
    jwt.verify(authResult.creds, config.secrets.session, function(err, result) {
      if(err !== null) {
        var error = new Verror(err, 'Authentication Validation');
        log('FAILED: ' + authResult + ' - ' + JSON.stringify(err, null, 2));
        self.emit('send-error', error, 'invalid token');
      } else {

        //TODO: Expired Token
        authResult.creds = {};
        authResult.creds.userName = result.email;
        self.emit('get-User', authResult);
      }
    });
  };

  var createToken = function(authResult) {
    var data = {id: authResult.user.id, email: authResult.user.email};
    var expires = {expiresInMinutes: 60*5};

    authResult.user.token = jwt.sign(data, config.secrets.session, expires);
    self.emit('send-data', authResult.user);
  };

  // Retrieve the User from the DB
  var getUser = function(authResult) {
    var params = { userName: authResult.creds.userName };

    userService.setup(config);
    userService.read(params, function(err, result) {
      if(err !== null) {
        var error = new Verror(err, 'Creating User Service');
        log('FAILED: ' + params + ' - ' + JSON.stringify(err, null, 2));
        self.emit('send-error', error);
      } else if(result === null) {
        self.emit('send-error', null, 'invalid user');
      } else {
        authResult.user = result;
        self.emit('check-Password', authResult);
      }
    });
  };

  var checkPassword = function(authResult) {
    if(!authResult.creds.password) {
      self.emit('check-Active', authResult);
    } else {
      var match = bcrypt.compareSync(authResult.creds.password, authResult.user.password);
      if(!match) {
        self.emit('send-error', null, 'invalid user');
      } else {
        self.emit('check-Active', authResult);
      }
    }
  };

  var checkActive = function(authResult) {
    if(authResult.user.status !== 'ACTIVE') {
      self.emit('send-error', null, 'user not active');
    } else {
      self.emit('create-Token', authResult);
    }
  };





  // Happy
  // 1) Validate
  // 2) Create

  /////////////////////////////////////////

  //  Exposed Registration Method
  self.login = function(creds, next){
    continueWith = next;
    var authResult = new AuthResult(creds);

    self.emit('validate-Inputs', authResult);
  };

  self.token = function(token, next){
    continueWith = next;
    var authResult = new AuthResult(token);

    self.emit('validate-Token', authResult);
  };


  // Event Wireup
  self.on('send-data', sendData);
  self.on('send-error', sendError);
  self.on('validate-Inputs', validateInputs);
  self.on('validate-Token', validateToken);
  self.on('verify-token', verifyToken);
  self.on('create-Token', createToken);
  self.on('get-User', getUser);
  self.on('check-Password', checkPassword);
  self.on('check-Active', checkActive);

  return self;
};

util.inherits(AuthenticationService,Emitter);
module.exports = AuthenticationService;
