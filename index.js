'use strict';

var Service = require('./lib/membership');

var Membership = function() {
  var self = this;
  var service = null;
  var config = null;

  self.setup = function (configuration){
    config = configuration;
  };

  self.sample = function(input, done) {
    service = new Service(config);
    service.good(input, function(err, result) {
      if(err) {
        done(err, null);
      } else if (!result.success) {
        done(result.message, null);
      } else {
        done(null, result.data);
      }
    });
  };

  return self;
};

module.exports = new Membership();
