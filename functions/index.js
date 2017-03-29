(() => {
  'use strict';

  const crypto = require('crypto');
  const uuid = require('uuid');
  const functions = require('firebase-functions');
  const admin = require('firebase-admin');

  admin.initializeApp(functions.config().firebase);

  const auth = admin.auth();

  function randomBytes(size) {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(size, (err, buf) => {
        if (err) {
          reject(err);
        } else {
          resolve(buf);
        }
      });
    });
  }

  exports.initialize = functions.https.onRequest((req, res) => {
    const resInfo = {
      email: null,
      password: null
    };
    Promise.resolve()
    .then(() => randomBytes(16))
    .then((passwordBuffer) => {
      resInfo.email = `${uuid.v4()}@my-device.com`;
      resInfo.password = passwordBuffer.toString('hex');
      return auth.createUser({
        email: resInfo.email,
        password: resInfo.password
      });
    })
    .then(() => res.status(200).json(resInfo))
    .catch((err) => res.status(400).json({
      error: {
        name: err.name,
        message: err.message
      }
    }));
  });
})();
