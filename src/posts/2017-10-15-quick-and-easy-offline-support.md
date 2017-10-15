---
layout: post.html
title:  Quick & easy offline support
date:   2017-10-15
tags:
summary: "Adding offline support to your site is easier than ever these days thanks to service workers."
---
Adding offline support to your site is easier than ever these days thanks to service workers.

I recently added offline support to my blog with a small service worker using a 'stale-while-revalidate' technique that will always serve up a cached resource to the user if available, if not it will fall back to the normal network response. The beauty of this technique is that it always attempts to perform the network response and will cache the up-to-date response for use next time.

```javascript
/* 📄 service-worker.js */

var CACHE = 'v1';

// Intercept all network requests
self.addEventListener('fetch', function(event) {
  event.respondWith(fetchAndCache(event));
});

function fetchAndCache(event) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(event.request).then(function(response) {
      // Fetch from the network regardless of a cached resource
      var fetchResponse = fetch(event.request)
        .then(function(networkResponse) {
          // Cache the up-to-date resource
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      // Return the cached response if it exists or fallback to the network
      return response || fetchResponse;
    });
  });
}
```

> **NOTE:** Make sure you have cache headers appropriately set. I spent a good chunk of time trying to debug why the cache wasn't updating and realised it was due to a high `max-age` header being set on the resource.

You can get around a misguided `max-age` issue by implementing some cache-busting within the service worker. When calling out to the network for the resource you can append a random string to force the browser to go to the server to a fresh copy.

```javascript
/* 📄 service-worker.js */
var CACHE = 'v1';

// Intercept all network requests
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
    return cache.match(event.request).then(function(response) {
      // Fetch from the network regardless of a cached resource
      var fetchResponse = fetch(cacheBust(event.request))
        .then(function(networkResponse) {
          // Cache the up-to-date resource
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      // Return the cached response if it exists or fallback to the network
      return response || fetchResponse;
    });
  });
}
```

To read about other strategies I highly recommend reading [Jake Archibald](https://twitter.com/jaffathecake)'s post [offline cookbook](https://jakearchibald.com/2014/offline-cookbook)
