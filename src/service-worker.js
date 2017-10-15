var CACHE = 'v2';

self.addEventListener('fetch', function(event) {
  event.respondWith(fetchAndCache(event));
});

function cacheBust(request) {
  var url = request.url;
  if (url.indexOf(self.location.origin) >= 0) {
    if (url[url.length - 1] !== '/' && (url.indexOf('.') < 0 || url.lastIndexOf('.') < self.location.origin.length)) {
      url += `/`;
    }
    return `${url}?${Math.random()}`;
  } else {
    return request;
  }
}

function fetchAndCache(event) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(event.request).then(response => {
      var fetchResponse = fetch(cacheBust(event.request))
        .then(function(networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      return response || fetchResponse;
    });
  });
}
