const applicationServerPublicKey =
  "replace with your key";

function urlB64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function setupPushNotifications() {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    navigator.serviceWorker
      .register("sw.js")
      .then(function(registration) {
        // Registration was successful
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
        const applicationServerKey = urlB64ToUint8Array(
          applicationServerPublicKey
        );

        // Update service worker
        registration.update();

        registration.pushManager
          .subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
          })
          .then(function(subscription) {
            isPushEnabled = true;
            console.log(
              "subscription.subscriptionId: ",
              subscription.subscriptionId
            );
            console.log(
              "subscription.endpoint: ",
              JSON.stringify(subscription)
            );

            
            return sendSubscriptionToServer(subscription);
          });
      })
      .catch(function(err) {
        // registration failed :(
        console.log("ServiceWorker registration failed: ", err);
      });
  }
}

function sendSubscriptionToServer(subscription) {
  let xmlhttp = new XMLHttpRequest();
  let url = "/api/subscribe";

  xmlhttp.onreadystatechange = event => {
    let request = event.target;
    if (request.readyState === 4 && request.status === 200) {
      console.log("Success");
    }
  };

  xmlhttp.open("POST", url, true);
  xmlhttp.setRequestHeader("Content-Type", "application/json");

  xmlhttp.send(JSON.stringify(subscription));
}

function notifySubscribers() {
  let xmlhttp = new XMLHttpRequest();
  let url = "/api/notify";

  xmlhttp.onreadystatechange = event => {
    let request = event.target;
    if (request.readyState === 4 && request.status === 200) {
      console.log("Success");
    }
  };

  xmlhttp.open("POST", url, true);

  xmlhttp.send();
}

function unsubscribe() {
  let xmlhttp = new XMLHttpRequest();
  let url = "/api/unsubscribe";

  xmlhttp.onreadystatechange = event => {
    let request = event.target;
    if (request.readyState === 4 && request.status === 200) {
      console.log("Success");
    }
  };

  xmlhttp.open("POST", url, true);

  xmlhttp.send();
}

setupPushNotifications();
