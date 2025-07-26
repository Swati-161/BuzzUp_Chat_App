const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://buzzup-724ca-default-rtdb.asia-southeast1.firebasedatabase.app/',
  });
}

module.exports = { admin, db: admin.database() };