var CACHE = 'v1';

self.addEventListener('fetch', function(event) {
  event.respondWith(fetchAndCache(event));
});

function fetchAndCache(event) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(event.request)
      .then(function(response) {
        cache.put(event.request, response.clone());
        return response;
      })
      .catch(function() {
        return cache.match(event.request);
      });
  });
}
