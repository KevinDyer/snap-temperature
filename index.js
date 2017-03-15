(() => {
  'use strict';

  const firebase = require('firebase');
  const Raspi = require('raspi-io');
  const five = require('johnny-five');

  const config = {
    apiKey: 'AIzaSyDTB8FOhoqeHj-kvxfkTjSxOIuCBYA_uXU',
    authDomain: 'pup-alert-dev.firebaseapp.com',
    databaseURL: 'https://pup-alert-dev.firebaseio.com',
    storageBucket: 'pup-alert-dev.appspot.com',
    messagingSenderId: '483016445952'
  };
  firebase.initializeApp(config);

  const database = firebase.database();
  const auth = firebase.auth();

  const rootRef = database.ref();
  let temperatureRef = null;

  auth.signInAnonymously()
  .then(() => {
    temperatureRef = rootRef.child('temperature').child(auth.currentUser.uid);
  })
  .catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;

    if (errorCode === 'auth/operation-not-allowed') {
      console.warn('You must enable Anonymous auth in the Firebase Console.');
    } else {
      console.error(error);
    }
  });

  const board = new five.Board({
    io: new Raspi()
  });

  board.on('ready', () => {
    const led = new five.Led('P1-7');
    led.off();

    const temperature = new five.Thermometer({
      controller: 'TMP102'
    });

    let timeout = null;
    temperature.on('change', () => {
      led.on();
      clearTimeout(timeout);
      timeout = setTimeout(() => led.off(), 1000);
      if (null !== temperatureRef) {
        temperatureRef.set(temperature.celsius)
        .catch((err) => console.warn(err.message));
      }
    });
  });

})();
