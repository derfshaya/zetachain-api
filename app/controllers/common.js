'use strict';

/* Util dependencies */
var bDb = require('../../lib/BlockDb').default();

exports.handleErrors = function (err, res) {
  if (err) {
    if (err.code)  {
      res.status(400).send(err.message + '. Code:' + err.code);
    }
    else {
      res.status(503).send(err.message);
    }
  }
  else {
    res.status(404).send('Not found');
  }
};

exports.getISODateString = function(unixTime) {
    return new Date(unixTime*1000).toISOString();
}

exports.getBlockHeight = function(hash, next) {
    bDb.getHeight(hash, next);
}

exports.getTip = function(next) {
    bDb.getTip(next);
}

exports.getBlockHeightAndConfirmations = function(hash, next) {
    var self = this;
    self.getBlockHeight(hash, function(err, blockHeight) {
      if (err)
        return next(err);
      self.getConfirmationsFromHeight(blockHeight, next);
    });
}

exports.getConfirmationsFromHeight = function (height, next) {
    var self = this;
    self.getTip(function(err, tip, tipHeight) {
      if (err)
        return next(err);
      return next(null, height, tipHeight - height + 1);
    });
}