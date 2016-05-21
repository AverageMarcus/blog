---
layout: post.html
title: "Achieving 100 Google points"
date: 2014-07-17
tags: Web
summary: "Recently I have re-built my blog (hence the new life that has sprouted), not that you can tell. I spent a portion of last week moving away from [Ghost](https://ghost.org/) to using [Jekyll](http://jekyllrb.com/). With this I took the opportunity to improve the performance by utilizing [Grunt](http://gruntjs.com/) as part of the build workflow. This allowed me to achieve a 100/100 rating on [Google PageSpeed Insights](http://developers.google.com/speed/pagespeed/insights/?url=blog.marcusnoble.co.uk)."
---

Recently I have re-built my blog (hence the new life that has sprouted), not that you can tell. I spent a portion of last week moving away from [Ghost](https://ghost.org/) to using [Jekyll](http://jekyllrb.com/). With this I took the opportunity to improve the performance by utilizing [Grunt](http://gruntjs.com/) as part of the build workflow. This allowed me to achieve a 100/100 rating on [Google PageSpeed Insights](http://developers.google.com/speed/pagespeed/insights/?url=blog.marcusnoble.co.uk).

{{> picture alt="100/100" caption="All the Google points!" url="/images/GooglePageInsights.PNG" }}

> So, what's my secret?

Well its simple, do what [Google says](https://developers.google.com/speed/docs/insights/rules).

Here are the steps I took to get up to the 100 mark...

## 1. Use a static site

Using static sites (as opposed to dynamic sites) makes this much easier. As the HTML is fixed and not going to change based on what the user does or what data may be in a database you can ensure that what is rendered is in the best possible state.

I have used [Jekyll](http://jekyllrb.com/) for my Blog but I have heard good things about [Middleman](http://middlemanapp.com/), [Harp.js](http://harpjs.com/) and [Sculpin](https://sculpin.io/).

## 2. Be tappable

For any links, buttons, etc. on your pages that you want people to interact with make sure they can be pressed with a fat finger on a small touchscreen. This means to give grouped buttons enough space around them so the user can easily tap the one they want without inadvertently tapping the other and that links are roughly 2.4mm in height.

This one I have to keep fighting with. As new links appear on the page, Google sometimes decides some of them aren't big enough.

> The following tips make use of [Grunt](http://gruntjs.com/), if you haven't used it before then be sure to read the [getting started](http://gruntjs.com/getting-started) first.

## 3. Remove unused CSS

There is a great Grunt plugin called [uncss](https://github.com/addyosmani/grunt-uncss) that will remove unused CSS from your stylesheets, thus reducing the overall filesize. I found this to be mostly useful when applied to 3<sup>rd</sup> party stylesheets (such as bootstrap).

### Example config

<pre><code class="javascript">
uncss: {
	dist: {
	    options: {
	      ignore: ['.center'], // Ensure these styles aren't removed
	      stylesheets  : ['css/screen.css'] // The stylesheets to check
	    },
	    files: {
	        'css/screen.min.css': ['*.html', '_layouts/*.html', '_includes/*.html'] // Output stylesheet and the pages to check against
	    }
	},
	bootstrap: {
	    options: {
	      stylesheets  : ['css/bootstrap.min.css']
	    },
	    files: {
	        'css/bootstrap.min.css': ['*.html', '_layouts/*.html', '_includes/*.html']
	    }
	},
	fontawesome: {
	    options: {
	      stylesheets  : ['css/font-awesome.min.css']
	    },
	    files: {
	        'css/font-awesome.min.css': ['*.html', '_layouts/*.html', '_includes/*.html']
	    }
	}
}
</code></pre>

## 4. Shrink your CSS more!

Removing unused CSS is nice but there is still a lot of bloat that isn't required - spaces, line breaks & comments. The browser doesn't use any of this, so why bother sending it? The [grunt-contrib-cssmin](https://github.com/gruntjs/grunt-contrib-cssmin) achieves this nicely. To keep files readable when developing we can have cssmin output the minified files as a *.min.css file, leaving the original intact. I don't use any JavaScript on my Blog but there is also [grunt-contrib-uglify](https://github.com/gruntjs/grunt-contrib-uglify) that can shrink down your JavaScript files in a similar way.

### Example config

<pre><code class="javascript">
cssmin: {
    dist: {
        expand: true,
        cwd: 'css/',
        src: ['*.css'],
        dest: 'css/',
        ext: '.min.css'
    }
}
</code></pre>

## 5. Get those images into shape

Images often make up the bulk of a websites total filesize.<sup>[*citation needed*]</sup> Just like with CSS we should also be reducing bloat from our images. [grunt-contrib-imagemin](https://github.com/gruntjs/grunt-contrib-imagemin) can do this for us, with options to specify how much compression to apply. I left it at default and saw a rather sizable reduction with some images with no noticeable quality loss.

### Example config

<pre><code class="javascript">
imagemin: {
    static: {
        options: {
            optimizationLevel: 3
        },
        files: [{
            expand: true,
            cwd: 'images',
            src: '**/*.{png,PNG,jpg,JPG,gif,GIF}',
            dest: 'images'
        }]
    }
}
</code></pre>

## 6. Reducing time over the wire

When a web browser loads a site, it must first fetch the HTML file, read over it all and then fetch any associated resources (stylesheets, JavaScript files) causing additional calls back to the web server. This is just wasteful! Why make the browser ask for what we already know it needs? So, [grunt-html-smoosher](https://github.com/motherjones/grunt-html-smoosher) to the rescue. This handy little plugin will take HTML files and replace resource tags (e.g. `<link>`) with their content inline.

### Example config

<pre><code class="javascript">
smoosher: {
    all: {
      files: [
        {
          expand: true,
          cwd: '_site/',
          src: ['**/*.html'],
          dest: '_site/'
        }
      ]
    }
}
</code></pre>

## 7. Shrink whats left

So, we've reduced our CSS, our JavaScript (if we have any) and our images. We've event smooshed most of these into a single file. What could possibly be left? Why the HTML of course! So for our final trick we are going to use [grunt-contrib-htmlmin](https://github.com/gruntjs/grunt-contrib-htmlmin) to remove all spacing, line breaks and comments from our final HTML files.

### Example config

<pre><code class="javascript">
htmlmin: {
    dist: {
      options: {
        removeComments: true,
        collapseWhitespace: true
      },
      files: [
        {
          expand: true,
          cwd: '_site/',
          src: ['**/*.html'],
          dest: '_site/',
        },
      ]
    }
}
</code></pre>


# Bonus - Getting the Green Padlock

As an aside I recommend giving this post about [setting up SSL in nginx](https://gauntface.com/blog/2014/07/04/installing-ssl-certs) by [Matt Gaunt](https://gauntface.com/). It walks through the process of getting a free SSL certificate and configuring nginx to make best use of it with [SSL Labs test](https://www.ssllabs.com/ssltest/analyze.html?d=blog.marcusnoble.co.uk&hideResults=on) to validate the improvements

# Conclusions

As you can see, it doesn't take a lot to improve the performance of websites. Pull all this together into an effective workflow and you don't even need to worry about it anymore. I have all my Grunt jobs, including one to [build the Jekyll sites](https://github.com/dannygarcia/grunt-jekyll), as a post-receive [Git hook](http://git-scm.com/book/en/Customizing-Git-Git-Hooks). No more ftp/scp nonsense, no more remembering how to build my site, just code and push. Simple! :smile:

If anyone uses a similar approach to their sites, or has ways to improve please <a href="https://twitter.com/intent/tweet?screen_name=Marcus_Noble_" class="twitter-contact-link" data-related="Marcus_Noble_" data-dnt="true" target="_blank"><i class="icon-twitter"></i>Tweet @Marcus\_Noble_</a>