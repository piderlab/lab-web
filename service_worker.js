this.addEventListener("fetch", function (event) {
  if (navigator.onLine) {
    event.respondWith(fetch(event.request));
  } else {
    event.respondWith(
      new Response(
        "このページはオフラインでは利用できません。ネットワークに接続してください。",
      ),
    );
  }
});
