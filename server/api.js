const express = require("express");
const bodyParser = require("body-parser");
const webpush = require("web-push");
const fs = require("fs");
const urlbase64 = require("urlsafe-base64");
const request = require("request");

const router = express.Router();
const jsonParser = bodyParser.json();

const dataUrl =
  "http://gt-stable-insurer-node.centralus.cloudapp.azure.com/api";

// VAPID keys should only be generated only once.
let vapidKeys = {};

if (fs.existsSync("server/vapid.key") && fs.existsSync("server/vapid.pubkey")) {
  vapidKeys.publicKey = fs.readFileSync("server/vapid.pubkey").toString();
  vapidKeys.privateKey = fs.readFileSync("server/vapid.key").toString();
} else {
  vapidKeys = webpush.generateVAPIDKeys();

  fs.writeFileSync("server/vapid.key", urlbase64.encode(vapidKeys.privateKey));
  fs.writeFileSync(
    "server/vapid.pubkey",
    urlbase64.encode(vapidKeys.publicKey)
  );
}

webpush.setVapidDetails(
  "mailto:cristian.sandu@cegeka.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

console.log(vapidKeys.publicKey);

let subscriptions = {};

function getClientAddress(req) {
  return (
    (
      req.headers["X-Forwarded-For"] ||
      req.headers["x-forwarded-for"] ||
      ""
    ).split(",")[0] || req.client.remoteAddress
  );
}

router.post("/subscribe", jsonParser, (req, res) => {
  const subscription = req.body;
  const clientAddress = getClientAddress(req);

  console.log("User subscribed from " + clientAddress);

  subscriptions[clientAddress] = {
    endpoint: subscription,
    index: 0
  };

  return res.json({ message: "OK" });
});

router.post("/unsubscribe", (req, res) => {
  const clientAddress = getClientAddress(req);

  console.log("Unsubscribed " + clientAddress);

  delete subscriptions[clientAddress];

  return res.json({ message: "OK" });
});

router.post("/notify", (req, res) => {
  notifyAll();
  return res.json({ message: "OK" });
});

router.get("/notifications", (req, res) => {
  let today = new Date();
  today.setFullYear(today.getFullYear() - 1);

  let qs = { after: today.toISOString() };
  let id = req.query.id;

  request(
    {
      url: dataUrl.concat("/notifications"),
      qs: qs,
      json: true
    },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        if (id && id !== "") {
          let result = { items: [] };
          for (let i in body.items) {
            let item = body.items[i];

            if (item.Id === id) {
              result.items.push(item);
              break;
            }
          }

          return res.json(result);
        }
        return res.json(body);
      } else {
        res.status(404);
        return res.json({ message: "Error" });
      }
    }
  );
});

function notifyAll() {
  for (let host in subscriptions) {
    let subscription = subscriptions[host];

    notification = notificationsStack[subscription.index];

    // Next
    subscription.index++;
    if (subscription.index >= notificationsStack.length) {
      subscription.index = 0;
    }

    if (notification) {
      console.log("Sending notification to ".concat(host));
      webpush.sendNotification(
        subscription.endpoint,
        JSON.stringify(notification)
      );
    }
  }
}

let notificationsStack = [];

function loadServerNotifications() {
  let today = new Date();
  today.setFullYear(today.getFullYear() - 1);

  let qs = { after: today.toISOString() };
  request(
    {
      url: dataUrl.concat("/notifications"),
      qs: qs,
      json: true
    },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        notificationsStack = body.items.reverse();

        console.log("Done loading data");
      }
    }
  );
}

setInterval(notifyAll, 60 * 1000);

loadServerNotifications();

module.exports = router;
