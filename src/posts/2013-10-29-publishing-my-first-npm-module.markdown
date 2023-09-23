---
layout: post.html
title:  "Publishing My First NPM module"
date:   2013-10-29
tags: nodejs node npm javascript truncatise
summary: "For the past week or so (since setting up my new blog) I've been working on a new JavaScript module that truncates HTML."
---

For the past week or so (since setting up my new blog) I've been working on a new JavaScript module that truncates HTML.

Why have I been doing this you ask? Well, very quickly after putting together the theme for this  [Ghost](https://ghost.org/) blog I notice a small annoyance. The helper used to generate excerpts of post for the main page can only truncate based on character or word count. This seemed like a bit of a shortcoming to me, I wanted to be able to truncate on paragraphs so text isn't cut off mid-sentence.

And so [Truncatise](https://github.com/AverageMarcus/Truncatise) was born!

As this is my first forte into NPMs I used it as a learning experience.

My first learning opportunity came from writing tests against my new module (which turned out to be **VERY** useful in highlighting some mistakes). For this I used [mocha](https://github.com/visionmedia/mocha) and [chai](https://github.com/chaijs/chai) to construct some BDD/TDD tests.

I also took this as a chance to get to know git a bit better, with use of [http://git-scm.com/book](http://git-scm.com/book), and used the command line tools to set up the repository etc.

The [documentation](https://npmjs.org/doc/developers.html) to publish to the NPM registry was very straightforward. Surprisingly so.

* NPM Registry: [https://npmjs.org/package/truncatise](https://npmjs.org/package/truncatise)
* GitHub Repository: [https://github.com/AverageMarcus/Truncatise](https://github.com/AverageMarcus/Truncatise)
* Bug Reporting: [https://github.com/AverageMarcus/Truncatise/issues](https://github.com/AverageMarcus/Truncatise/issues)

I very much welcome bug reports and any contributions. So please use, test, break and modify to your use.

I eventually plan to replace the truncation module used by [Ghost](https://ghost.org/) with mine to get some real-world testing. If all is stable and bug-free I plan to put in a pull request to the master repository.
