const functions = require("firebase-functions").region("europe-west1");
const admin = require("firebase-admin");
const cors = require("cors")({
  // origin: true
});

const createProfile = require("./lib/create-profile");
const action = require("./lib/action");
const joinTable = require("./lib/join-table");
const leaveTable = require("./lib/leave-table");

const { JOIN, LEAVE } = require("./lib/types");

if (process.env.FUNCTIONS_EMULATOR) {
  // load config from services....
  const serviceAccount = require("../services/lightning-poker-firebase-adminsdk-pdomv-82e6bf58f2.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else admin.initializeApp();

exports.action = functions.https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    const { type } = request.body || {};
    if (!type) {
      return response.send({});
    }

    console.log(request.body);

    try {
      if (type === JOIN) {
        await joinTable(admin.firestore(), request.body);
      } else if (type === LEAVE) {
        await leaveTable(admin.firestore(), request.body);
      } else {
        await action(admin.firestore(), request.body);
      }
      return response.send({ success: true });
    } catch (e) {
      return response.status(500).send({ error: e.message });
    }
  });
});

exports.actionf = functions.firestore
  .document("/actions/{documentId}")
  .onCreate(async snap => {
    const { type } = snap.data();

    console.log(snap.data());

    try {
      if (type === JOIN) {
        await joinTable(admin.firestore(), snap.data());
      } else if (type === LEAVE) {
        await leaveTable(admin.firestore(), snap.data());
      } else {
        await action(admin.firestore(), snap.data());
      }
    } catch (e) {
      console.log(e.message);
    }
  });

exports.join = functions.https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    const { tableId } = request.body || {};
    if (!tableId) {
      return response.send({});
    }

    try {
      await joinTable(admin.firestore(), request.body);
      return response.send({ success: true });
    } catch (e) {
      return response.status(500).send({ error: e.message });
    }
  });
});

exports.leave = functions.https.onRequest(async (request, response) => {
  cors(request, response, async () => {
    const { tableId } = request.body || {};
    if (!tableId) {
      return response.send({});
    }

    try {
      await leaveTable(admin.firestore(), request.body);
      return response.send({ success: true });
    } catch (e) {
      return response.status(500).send({ error: e.message });
    }
  });
});

exports.createProfile = functions.auth
  .user()
  .onCreate(createProfile(admin.firestore()));
