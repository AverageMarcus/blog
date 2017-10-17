---
layout: post.html
title: Simple sharing
date: 2017-10-16
tags:
summary: "The line between the web and native applications is becoming more and more blurred. One of the latest goodies to land in browsers that gives our users a consistent, seamless experience is the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) currently only [available in Chrome](https://caniuse.com/#feat=web-share)."
---
The line between the web and native applications is becoming more and more blurred. One of the latest goodies to land in browsers that gives our users a consistent, seamless experience is the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share) currently only [available in Chrome](https://caniuse.com/#feat=web-share).

There are a couple requirements in order to use the Web Share API. Firstly, as with a lot of the new browser features, your site must be served over HTTPS. Second, you can only trigger the share UI as part of a user interaction, such as a click. You can share any URL you want, it doesn't have to just be the page your user is currently on.

As support is very limited you should use feature detection to make sure the browser supports it before showing the share button to your user.

```javascript
if (navigator.share) {
  // We're good to go
  useNativeShare();
} else {if (navigator.share) {
  // Web Share API isn't supported, we can fall back to classic methods such as a share button for each social platform
  useFallbackShare();
}
```

You can trigger the native dialog by calling `navigator.share()` from a user interaction event. You have the option of setting the URL, title and a bit of text to share. All properties are optional but at least one must be provided.

```javascript
function useNativeShare() {
  shareButton.addEventListener('click', function(event) {
    event.preventDefault();
    navigator.share({
      url: window.location.href,
      title: document.title,
      text: "Check this out! You wouldn't believe what happens..."
    });
  });
}
```

{{> picture url="/images/WebShare.jpg" alt="Example Web Share API Dialog" caption="Native UI" }}

You can read more about the Web Share API from [Google Developers](https://developers.google.com/web/updates/2016/09/navigator-share).
