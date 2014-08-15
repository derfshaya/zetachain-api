'use strict';

var path = require('path'),
  fs = require('fs'),
  rootPath = path.normalize(__dirname + '/..'),
  env,
  db,
  port,
  b_port,
  p2p_port;

var packageStr = fs.readFileSync('package.json');
var version = JSON.parse(packageStr).version;


function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

var home = process.env.INSIGHT_DB || (getUserHome() + '/.insight');

if (process.env.INSIGHT_NETWORK === 'livenet') {
  env = 'livenet';
  db = home;
  port = '3000';
  b_port = '17334';
  p2p_port = '17333';
} else {
  env = 'testnet';
  db = home + '/testnet';
  port = '3001';
  b_port = '27334';
  p2p_port = '27333';
}


switch (process.env.NODE_ENV) {
  case 'production':
    env += '';
    break;
  case 'test':
    env += ' - test environment';
    break;
  default:
    env += ' - development';
    break;
}

var network = process.env.INSIGHT_NETWORK || 'livenet';

var dataDir = process.env.ZETACOIND_DATADIR;
var isWin = /^win/.test(process.platform);
var isMac = /^darwin/.test(process.platform);
var isLinux = /^linux/.test(process.platform);
if (!dataDir) {
  if (isWin) dataDir = '%APPDATA%\\Zetacoin\\';
  if (isMac) dataDir = process.env.HOME + '/Library/Application Support/Zetacoin/';
  if (isLinux) dataDir = process.env.HOME + '/.zetacoin/';
}
dataDir += network === 'testnet' ? 'testnet3' : '';

var safeConfirmations = process.env.INSIGHT_SAFE_CONFIRMATIONS || 6;
var ignoreCache = process.env.INSIGHT_IGNORE_CACHE || 0;


var bitcoindConf = {
  protocol: process.env.ZETACOIND_PROTO || 'http',
  user: process.env.ZETACOIND_USER || 'user',
  pass: process.env.ZETACOIND_PASS || 'pass',
  host: process.env.ZETACOIND_HOST || '127.0.0.1',
  port: process.env.ZETACOIND_PORT || b_port,
  p2pPort: process.env.ZETACOIND_P2P_PORT || p2p_port,
  p2pHost: process.env.ZETACOIND_P2P_HOST || process.env.ZETACOIND_HOST || '127.0.0.1',
  dataDir: dataDir,
  // DO NOT CHANGE THIS!
  disableAgent: true
};

var enableMessageBroker = process.env.ENABLE_MESSAGE_BROKER === 'true';

if (!fs.existsSync(db)) {
  var err = fs.mkdirSync(db);
  if (err) {
    console.log(err);
    console.log("## ERROR! Can't create insight directory! \n");
    console.log('\tPlease create it manually: ', db);
    process.exit(-1);
  }
}

module.exports = {
  enableMessageBroker: enableMessageBroker,
  version: version,
  root: rootPath,
  publicPath: process.env.INSIGHT_PUBLIC_PATH || false,
  appName: 'Insight ' + env,
  apiPrefix: '/api',
  port: port,
  leveldb: db,
  bitcoind: bitcoindConf,
  network: network,
  disableP2pSync: false,
  disableHistoricSync: false,
  poolMatchFile: rootPath + '/etc/minersPoolStrings.json',

  // Time to refresh the currency rate. In minutes
  currencyRefresh: 10,
  keys: {
    segmentio: process.env.INSIGHT_SEGMENTIO_KEY
  },
  safeConfirmations: safeConfirmations, // PLEASE NOTE THAT *FULL RESYNC* IS NEEDED TO CHANGE safeConfirmations
  ignoreCache: ignoreCache,
};
