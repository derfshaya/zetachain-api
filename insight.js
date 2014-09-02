#!/usr/bin/env node

'use strict';
//Set the node enviornment variable if not set before
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Module dependencies.
 */
var express = require('express'),
  fs = require('fs'),
  PeerSync = require('./lib/PeerSync'),
  HistoricSync = require('./lib/HistoricSync');

//Initializing system variables
var config = require('./config/config');

// text title
/*jshint multistr: true */
console.log(
  '\n\
 _____     _             _           _   \n\
/ _  / ___| |_ __ _  ___| |__   __ _(_)_ __  \n\
\\// / / _ \\ __/ _` |/ __| '_ \\ / _` | | '_ \\ \n\
 / //\\  __/ || (_| | (__| | | | (_| | | | | | \n\
/____/\\___|\\__\\__,_|\\___|_| |_|\\__,_|_|_| |_| \n\
\n \
\n\t\t\t\t\t\tv%s\n\
# Configuration:\n\
\tINSIGHT_NETWORK (Network): %s\n\
\tINSIGHT_DB (Database Path):  %s\n\
\tINSIGHT_SAFE_CONFIRMATIONS (Safe Confirmations):  %s\n\
\tINSIGHT_IGNORE_CACHE (Ignore Cache):  %s\n\
 # Zetacoind Connection configuration:\n\
\tRPC Username: %s\t\tBITCOIND_USER\n\
\tRPC Password: %s\tBITCOIND_PASS\n\
\tRPC Protocol: %s\t\tBITCOIND_PROTO\n\
\tRPC Host: %s\t\tBITCOIND_HOST\n\
\tRPC Port: %s\t\t\tBITCOIND_PORT\n\
\tP2P Port: %s\t\t\tBITCOIND_P2P_PORT\n\
\tBITCOIND_DATADIR: %s\n\
\t%s\n\
\nChange setting by assigning the enviroment variables above. Example:\n\
 $ INSIGHT_NETWORK="testnet" BITCOIND_HOST="123.123.123.123" ./insight.js\
\n\n',
  config.version,
  config.network, config.leveldb, config.safeConfirmations, config.ignoreCache ? 'yes' : 'no',
  config.bitcoind.user,
  config.bitcoind.pass ? 'Yes(hidden)' : 'No',
  config.bitcoind.protocol,
  config.bitcoind.host,
  config.bitcoind.port,
  config.bitcoind.p2pPort,
  config.bitcoind.dataDir + (config.network === 'testnet' ? '*' : ''), (config.network === 'testnet' ? '* (/testnet3 is added automatically)' : '')
);

/**
 * express app
 */
var expressApp = express();

/**
 * Bootstrap models
 */
var models_path = __dirname + '/app/models';
var walk = function(path) {
  fs.readdirSync(path).forEach(function(file) {
    var newPath = path + '/' + file;
    var stat = fs.statSync(newPath);
    if (stat.isFile()) {
      if (/(.*)\.(js$)/.test(file)) {
        require(newPath);
      }
    } else if (stat.isDirectory()) {
      walk(newPath);
    }
  });
};

walk(models_path);

/**
 * p2pSync process
 */

var peerSync = new PeerSync({
  shouldBroadcast: true
});

if (!config.disableP2pSync) {
  peerSync.run();
}

/**
 * historic_sync process
 */
var historicSync = new HistoricSync({
  shouldBroadcastSync: true
});
peerSync.historicSync = historicSync;

if (!config.disableHistoricSync) {
  historicSync.start({}, function(err) {
    if (err) {
      var txt = 'ABORTED with error: ' + err.message;
      console.log('[historic_sync] ' + txt);
    }
    if (peerSync) peerSync.allowReorgs = true;
  });
} else
if (peerSync) peerSync.allowReorgs = true;


//express settings
require('./config/express')(expressApp, historicSync, peerSync);

//Bootstrap routes
require('./config/routes')(expressApp);

// socket.io
var server = require('http').createServer(expressApp);
var ios = require('socket.io')(server);
require('./app/controllers/socket.js').init(ios, config);

//Start the app by listening on <port>
server.listen(config.port, function() {
  console.log('insight server listening on port %d in %s mode', server.address().port, process.env.NODE_ENV);
});

//expose app
exports = module.exports = expressApp;
