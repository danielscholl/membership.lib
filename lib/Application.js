'use strict';

var Application = function(args){

  var app = {};
  app.email = args.email;
  app.password = args.password;
  app.confirm = args.confirm;
  app.status = 'pending';
  app.message = null;

  app.isValid = function(){
    return app.status === 'valid';
  };

  app.setInvalid = function(message){
    app.status = 'invalid';
    app.message = message;
  };

  app.setValid = function(message){
    app.status = 'NEW';
    app.message = message;
  };

  return app;
};

module.exports = Application;
