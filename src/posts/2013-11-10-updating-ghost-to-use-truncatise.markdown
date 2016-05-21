---
layout: post.html
title:  "Updating Ghost to use Truncatise"
date:   2013-11-10
tags: nodejs node npm javascript truncatise ghost
summary: "Today I finally got around to modifying my <a href='https://ghost.org/' target='_blank'>Ghost</a> blog to make use of my new Node Module <a href='//blog.marcusnoble.co.uk/publishing-my-first-npm-module/'>Truncatise</a>.<br/><br/>This didn't go as smoothly as I hoped."
---

Today I finally got around to modifying my [Ghost](https://ghost.org/) blog to make use of my new Node Module [Truncatise](/10-29-2013-publishing-my-first-npm-module/).

This didn't go as smoothly as I hoped.

First, I discovered a [bug](//github.com/AverageMarcus/Truncatise/issues/1) in my module. It was incorrectly handling the combination of `<p>` tags with double newlines when truncating to paragraphs.

To resolve this I needed to determine whether or not to use double newline to indicate a paragraph. This was done by ignoring any newlines between paragraph tags and better regular expression matching.

I also noticed an issue with the suffix, e.g. &hellip;, when used with `<p>` tags, it was rending after the and of the tag and thus display on a new line. _Whoops!_ Not what is expected. A quick little replace when not stripping HTML solved this.

So, finally I published version 0.0.2 of [Truncatise](//npmjs.org/package/truncatise) to the NPM repository (as well as [GitHub](//github.com/AverageMarcus/Truncatise)).

As I was now happy that the issues were resolved, I made progress on modifying the Ghost helper source code to use Truncatise instead of [downsize](//npmjs.org/package/downsize).

#### Original:
<pre><code class="javascript">
coreHelpers.excerpt = function (options) {
    var truncateOptions = (options || {}).hash || {},
        excerpt;

    truncateOptions = _.pick(truncateOptions, ['words', 'characters']);

    /*jslint regexp:true */
    excerpt = String(this.html).replace(/<\/?[^>]+>/gi, '');
    excerpt = excerpt.replace(/(\r\n|\n|\r)+/gm, ' ');
    /*jslint regexp:false */

    if (!truncateOptions.words && !truncateOptions.characters) {
        truncateOptions.words = 50;
    }

    return new hbs.handlebars.SafeString(
        downsize(excerpt, truncateOptions)
    );
};
</code></pre>

#### My Version:
<pre><code class="javascript">
coreHelpers.excerpt = function (options) {
    var truncateOptions = (options || {}).hash ||  {TruncateLength: 2, TruncateBy : "paragraphs", StripHTML : false, Suffix : '...'},
        excerpt;

    truncateOptions = _.pick(truncateOptions, ['TruncateBy', 'TruncateLength', 'StripHTML', 'Strict', 'Suffix']);

    excerpt = String(this.html);

    //Set default values
    if (!truncateOptions.TruncateLength) {
        truncateOptions.TruncateLength = 2;
    }
    if (!truncateOptions.TruncateBy) {
        truncateOptions.TruncateBy = "paragraphs";
    }
    if (!truncateOptions.StripHTML) {
        truncateOptions.StripHTML = false;
    }
    if (!truncateOptions.Suffix) {
        truncateOptions.Suffix = "&hellip;";
    }

    return new hbs.handlebars.SafeString(
        truncatise(excerpt, truncateOptions)
    );
};
</code></pre>

My changes have been pushed to my [fork of Ghost](//github.com/AverageMarcus/Ghost) if anyone wishes to make use of it.

## On Updating Ghost

I got into a bit of a mess when trying to update my copy of Ghost with the latest changes, mainly due to my carelessness. So I don't get into the same situation in the future, and to prevent others making my mistakes, here are my little tips to bare in mind:

1. Back up the `./content/data/` directory before doing anything!
2. If needed also backup your `./content/themes/` directory.
3. Copy across the new `./core`, `packages.json`, `index.js` and `Gruntfile.js`
4. `npm install -g grunt-cli`
5. `npm install --production`
6. `grunt init prod`

> If you get errors relating to sqlite3&hellip;

Run `npm install sqlite3 --build-from-source=sqlite3`

# Update:
I have since moved away from Ghost and now using Jekyll
