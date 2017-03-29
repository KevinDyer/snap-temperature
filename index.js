(() => {
  'use strict';

  const config = {
    apiKey: 'AIzaSyDTB8FOhoqeHj-kvxfkTjSxOIuCBYA_uXU',
    authDomain: 'pup-alert-dev.firebaseapp.com',
    databaseURL: 'https://pup-alert-dev.firebaseio.com',
    storageBucket: 'pup-alert-dev.appspot.com',
    messagingSenderId: '483016445952'
  };
  const firebase = require('firebase');
  firebase.initializeApp(config);

  const Raspi = require('raspi-io');
  const five = require('johnny-five');
  const parseArgs = require('minimist');
  const winston = require('winston');
  const Auth = require('./src/auth');

  const logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)()
    ]
  });

  const argv = parseArgs(process.argv.slice(2));

  const database = firebase.database();

  let temperatureRef = null;
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      temperatureRef = database.ref().child(`temperature/${user.uid}`);
    } else {
      temperatureRef = null;
    }
  });

  Auth.createAuth(argv)
  .then((auth) => auth.signIn())
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });

  const board = new five.Board({
    io: new Raspi(),
    repl: false
  });
  board.on('ready', () => {
    const led = new five.Led('P1-7');
    const temperature = new five.Thermometer({controller: 'TMP102'});

    led.off();

    let timeout = null;
    temperature.on('change', () => {
      led.on();
      clearTimeout(timeout);
      timeout = setTimeout(() => led.off(), 1000);
      if (null !== temperatureRef) {
        temperatureRef.set(temperature.celsius)
        .catch((err) => logger.warn(err.message));
      }
    });

    board.on('exit', () => {
      led.off();
    });
  });
})();
