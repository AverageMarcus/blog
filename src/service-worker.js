var CACHE = 'v1';

self.addEventListener('fetch', function(event) {
  event.respondWith(fetchAndCache(event));
});

function fetchAndCache(event) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(event.request).then(response => {
      var fetchResponse = fetch(event.request)
        .then(function(networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      return response || fetchResponse;
    });
  });
}
