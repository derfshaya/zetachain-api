'use strict';

var config = require('../../config/config');

// Set the initial vars
var timestamp = +new Date(),
    delay = config.currencyRefresh * 60000,
    zetaRate = 0;
    bitstampRate = 0;
    conversionRate = 0;

exports.index = function(req, res) {

  var _xhr = function() {
    if (typeof XMLHttpRequest !== 'undefined' && XMLHttpRequest !== null) {
      return new XMLHttpRequest();
    } else if (typeof require !== 'undefined' && require !== null) {
      var XMLhttprequest = require('xmlhttprequest').XMLHttpRequest;
      return new XMLhttprequest();
    }
  };

  var _request = function(url, cb) {
    var request;
    request = _xhr();
    request.open('GET', url, true);
    request.onreadystatechange = function() {
      if (request.readyState === 4) {
        if (request.status === 200) {
          return cb(false, request.responseText);
        }

        return cb(true, {
          status: request.status,
          message: 'Request error'
        });
      }
    };

    return request.send(null);
  };

  // Init
  var currentTime = +new Date();
  if (bitstampRate === 0 || currentTime >= (timestamp + delay)) {
    timestamp = currentTime;

    _request('https://www.bitstamp.net/api/ticker/', function(err, data) {
      if (!err) bitstampRate = parseFloat(JSON.parse(data).last);

      _request('https://api.mintpal.com/v1/market/stats/ZET/BTC', function(err,data) {
        if (!err) zetaRate = parseFloat(JSON.parse(data)[0].last_price);
        conversionRate = bitstampRate * zetaRate;
      });

      res.jsonp({
        status: 200,
        data: { bitstamp: conversionRate }
      });
    });
  } else {
    res.jsonp({
      status: 200,
      data: { bitstamp: conversionRate }
    });
  }
};
