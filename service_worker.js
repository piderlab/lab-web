this.addEventListener("fetch", function (event) {
  if (navigator.onLine) {
    event.respondWith(fetch(event.request));
  } else {
    event.respondWith(new Response("オフラインでは利用できません。"));
  }
});
