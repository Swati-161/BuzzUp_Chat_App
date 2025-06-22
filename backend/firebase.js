
const admin = require('firebase-admin');
const serviceAccount = require('./firebaseServiceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://buzzup-724ca-default-rtdb.asia-southeast1.firebasedatabase.app/'
});
const db = admin.database();

module.exports = db;
