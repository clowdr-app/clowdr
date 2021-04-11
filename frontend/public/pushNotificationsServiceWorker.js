// Note: This file has to be in the root directory...
// https://stackoverflow.com/questions/29874068/navigator-serviceworker-is-never-ready

console.info("Service worker loaded");

self.addEventListener("install", function () {
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("push", function (event) {
    console.info(`Push notification received\n${JSON.stringify(event.data.json(), null, 2)}`);
    if (event.data) {
        const notification = event.data.json();

        event.waitUntil(self.registration.showNotification(notification.title + (notification.subtitle ? " " + notification.subtitle : ""), {
            body: notification.description,
            icon: "favicon.png",
            lang: "en",
            badge: "favicon.png",
            data: notification
        }));
    }
});

self.addEventListener("notificationclick", function (event) {
    event.waitUntil(
        self.clients.matchAll().then(function (clientList) {

            if (clientList.length > 0) {
                return clientList[0].focus();
            }

            if (event.notification.data.linkURL) {
                return self.clients.openWindow(event.notification.data.linkURL);
            }

            return null;
        })
    );
});


// CHAT_TODO: How the heck do we handle this...? We don't have the user's id here,
//            nor any convenient way of creating an apollo client (or even importing
//            the apollo client code!)
// self.addEventListener("pushsubscriptionchange", function (event) {
//     console.log("Subscription expired");
//     event.waitUntil(
//         self.registration.pushManager.subscribe(event.oldSubscription.options)
//             .then(function (subscription) {
//                 console.log("Subscribed after expiration", subscription.endpoint);
//                 return fetch("register", {
//                     method: "post",
//                     headers: {
//                         "Content-type": "application/json"
//                     },
//                     body: JSON.stringify({
//                         endpoint: subscription.endpoint
//                     })
//                 });
//             })
//     );
// });

