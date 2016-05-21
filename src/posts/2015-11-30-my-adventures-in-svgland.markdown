---
layout: post.html
title:  "My Adventures in SVG-land"
date:   2015-11-30
tags: SVG Animation
summary: "A few months back a little [GitHub repo](https://github.com/benfoxall/logo-hacks) by [@benfoxall](https://github.com/benfoxall) caught my eye. Little did I know it'd lead me through a rabbit hole of fascination in SVG animation."
---

A few months back a little [GitHub repo](https://github.com/benfoxall/logo-hacks) by [@benfoxall](https://github.com/benfoxall) caught my eye. Little did I know it'd lead me through a rabbit hole of fascination in SVG animation.

I was amazed at how you could animate pictures using JavaScript. Pictures made up of markup! Previously pricey, bloated graphic applications had been needed to create such beautiful moving imagery. No more! Here is my story of SVG-land.

Slowly, over the next few months, I began learning more about SVGs. How to build them, how to tweak them, what can and can't be done and how to bring them to life.

My first experimentation in SVG animation was building upon the [JS Oxford](http://jsoxford.com/) logo Ben had already made and incorporating more into it. This became the [welcome](http://jsoxford.com/welcome.html) page to be used at meetups.

For a while I was satisfied with this. It worked, looked pretty cool and achieved what I intended.

But the itch to explore began to grow and I wanted to refine the process. As you can see from the [source](https://github.com/jsoxford/jsoxford.github.com/blob/develop/welcome.html) it wasn't the easiest thing to manage. I wanted to find out the best way to animate SVGs and what pros and cons of the various methods were.

There are really three ways to animate SVGs:

1) JavaScript

2) CSS

3) SMIL ([Going to be deprecated](https://groups.google.com/a/chromium.org/forum/#!msg/blink-dev/5o0yiO440LM/59rZqirUQNwJ))

I had used JavaScript previously but it wasn't a controlled animation, it was just randomly showing elements. I set out to create an animation that went from the "new" JS Oxford logo to the "classic" logo, to the meetup members photos and finally the standard horse.

{{> picture alt="Logo transitions" caption="The many faces of JS Oxford" url="/images/JSOxLogos.png" }}

## Attempt #1 - JavaScript

As I had used it previously I started off using JavaScript again.

[Source](https://github.com/AverageMarcus/AdventuresInSVG/blob/gh-pages/AnimatingWithJavaScript.html)

<iframe src="https://averagemarcus.github.io/AdventuresInSVG/AnimatingWithJavaScript.html" style="width:100%;border:0;height:600px">Live: https://averagemarcus.github.io/AdventuresInSVG/AnimatingWithJavaScript.html</iframe>

**Pros:**

* Easy to change the routine of the animation. If I wanted the horse animation first, just change it's position in the array.
* Timings can be dynamically changed. As you can see above I've provided links to speed up/slow down the animation.

**Cons:**

* Still needs a bit of CSS (classes) to keep it simple
* May not perform too well on low-end devices or if the amount of work done in JS is large

## Attempt #2 - CSS

CSS3 has animations as part of the language. I mainly relied upon using [keyframes](https://developer.mozilla.org/en-US/docs/Web/CSS/%40keyframes) and [transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform).

The major issue I experienced was with the [animation-delay](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-delay) property. As the name suggests, this property lets you specify a delay for the animation. My intention was to delay the pending logo transitions so that they'd start after the previous has finished. This worked great at first, but when the animation repeated the delay was ignored and everything started happening at once. As it stands this ability is currently lacking from the CSS spec. Some Googling suggested that I need to make clever use of the keyframes so that, for example, the first logo uses 0-25%, the second uses 25-50%, and so on.

This worked, but it isn't nice. If I decide I want to add or remove a transition I will need to work out and update *all* the keyframe timings.

[Source](https://github.com/AverageMarcus/AdventuresInSVG/blob/gh-pages/AnimatingWithCSS.html)

<iframe src="https://averagemarcus.github.io/AdventuresInSVG/AnimatingWithCSS.html" style="width:100%;border:0;height:600px">Live: https://averagemarcus.github.io/AdventuresInSVG/AnimatingWithCSS.html</iframe>

**Pros:**

* Very few lines of code needed to animate something.
* Animations are smooth

**Cons:**

* Timings are difficult and not flexible (as mentioned above).
* Timings are fixed and cannot be altered on-the-fly

## Attempt #3 - Promises (JS)

Not satisfied with my approach using JavaScript I decided to re-visit it and try to tackle it using promises.

Before this I hadn't *really* used promises (other than a little in NodeJS) and I knew the browser support was lacking so I checked out some of the libraries that provide promises.

I settled on [Q](https://github.com/kriskowal/q), mainly for its built-in `delay` function that would be super useful with timing animations.

[Source](https://github.com/AverageMarcus/AdventuresInSVG/blob/gh-pages/AnimatingWithPromises.html)

<iframe src="https://averagemarcus.github.io/AdventuresInSVG/AnimatingWithPromises.html" style="width:100%;border:0;height:600px">Live: https://averagemarcus.github.io/AdventuresInSVG/AnimatingWithPromises.html</iframe>

**Pros:**

* All the same as the JS ones above
* By making use of the `delay` function timing between animations can easily be varied.
* Nice, easy to read syntax

**Cons:**

* Much more code as a rather large library was used.

# Closing Thoughts

I'm still experimenting and learning. I'm sure that there are better ways to create more complex animations (if anyone knows, please let me know).

When working with SVGs on the web I urge you to make use of [SVGOMG](https://jakearchibald.github.io/svgomg/) to remove bloat and cleanup your SVGs.

Also, SVGs manipulation by JS/CSS may or may not be allowed depending on the way you include the SVG on the page. I recommend checking out [SVG On The Web](https://svgontheweb.com) to learn more.

One thing I did discover while on this journey is that Firefox (at time of writing) doesn't handle the `transform-origin` property, causing things to incorrectly fly around the logo in comical fashion.
