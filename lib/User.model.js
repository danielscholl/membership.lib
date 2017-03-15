'use strict';
var uuid = require('node-uuid');

var User = function(args) {

  var user = {};
  user.id = args.id || uuid.v4();
  user.email = args.email;
  //user.token = args.token || null;
  user.createdAt = args.createdAt || new Date();
  user.status = args.status || 'pending';
  user.signInCount = args.signInCount || 0;
  user.password = args.password || null;

  return user;
};

module.exports = User;
