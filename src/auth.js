(() => {
  'use strict';

  const USER_CREDENTIALS_FILENAME = 'userCredentials.json';
  const INITIALIZE_URL = 'https://us-central1-pup-alert-dev.cloudfunctions.net/initialize';

  const fs = require('fs-promise');
  const path = require('path');
  const request = require('superagent');
  const firebase = require('firebase');
  const winston = require('winston');

  const logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)()
    ]
  });

  const auth = firebase.auth();

  class Auth {
    constructor(dataDir) {
      this._credsFilepath = path.resolve(dataDir, USER_CREDENTIALS_FILENAME);
    }

    signIn() {
      return this._getCredentials()
      .then((creds) => {
        const email = creds.email;
        const password = creds.password;
        return auth.signInWithEmailAndPassword(email, password);
      })
      .catch((err) => {
        logger.error(err.message);
        return this._createCredentials()
        .then(() => {
          // TODO: Add back off timeout
        })
        .then(() => this.signIn());
      });
    }

    _getCredentials() {
      return this._readCredentials()
      .catch(() => this._createCredentials());
    }

    _readCredentials() {
      return fs.readFile(this._credsFilepath, 'utf8')
      .then(JSON.parse);
    }

    _createCredentials() {
      return this._initialize()
      .then((creds) => {
        return this._writeCredentials(creds)
        .then(() => creds);
      });
    }

    _initialize() {
      return new Promise((resolve, reject) => {
        request
        .get(INITIALIZE_URL)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res.body);
          }
        });
      });
    }

    _writeCredentials(creds) {
      const data = JSON.stringify(creds, null, 2);
      return fs.writeFile(this._credsFilepath, data, 'utf8');
    }

    static createAuth({dataDir=__dirname}={}) {
      return Promise.resolve()
      .then(() => fs.stat(dataDir))
      .then((stat) => {
        if (!stat.isDirectory()) {
          return Promise.reject(new Error('dataDir is not a directory'));
        }
      })
      .then(() => new Auth(dataDir));
    }
  }

  module.exports = Auth;
})();
