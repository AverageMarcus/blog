"use strict";
const fs = require('fs');
const https = require('https');
const express = require('express');
const compress = require('compression');
const app = express();
const Metalsmith = require('metalsmith');
const inplace = require('metalsmith-in-place');
const layouts = require('metalsmith-layouts');
const markdown = require('metalsmith-markdownit');
const permalinks = require('metalsmith-permalinks');
const collections = require('metalsmith-collections');
const pagination = require('metalsmith-pagination');
const define = require('metalsmith-define');
const feed = require('metalsmith-feed');
const sass = require('metalsmith-sass');
const date = require('metalsmith-build-date');
const sitemap = require('metalsmith-sitemap');
const Handlebars = require('handlebars');
const emoji = require('markdown-it-emoji');
const moment = require('moment');
const striptags = require('striptags');

const port = process.env.PORT || 8000;

app.disable('x-powered-by');
app.use(compress());
app.use(express.static(__dirname + '/build'));

// Lets try and slow down some of those exploit crawlers
app.use("/", require('./filterRoutes'));

// Handle some iOS icon 404s
app.get("/apple-touch-icon*", function(req, res) {
  res.sendFile(__dirname + '/build/images/favico/' + req.url, () => {
    res.sendFile(__dirname + '/build/images/favico/apple-touch-icon.png');
  });
});

app.get("/favicon.png", function(req, res) {
  res.sendFile(__dirname + '/build/images/favico/apple-touch-icon.png');
});

app.get("/robots.txt", function(req, res) {
  res.send("User-agent: * Disallow: ");
})

app.get(/(\/(feeds?|rss|atom)\/?|feed.xml|rss.xml|index.rss|feed.rss)$/, function(req, res) {
  res.redirect(301, '/feed.xml');
})

app.get("/healthz", function(req, res) {
  res.sendStatus(200);
})

var md = markdown({html: true});
md.parser.use(emoji);
const proxy = (tokens, idx, options, env, self) => self.renderToken(tokens, idx, options);
const defaultTableOpenRenderer = md.parser.renderer.rules.table_open || proxy;
md.parser.renderer.rules.table_open = function(tokens, idx, options, env, self) {
  tokens[idx].attrJoin("role", "grid");
  return defaultTableOpenRenderer(tokens, idx, options, env, self)
};

Handlebars.registerHelper('markdown', function(text) {
  if(!text) return;
  return md.parser.render(text);
});
Handlebars.registerHelper('moment', function(date, format) {
  return new moment(date).format(format);
});
Handlebars.registerHelper("striptags", function(text){
	return striptags(text);
});
Handlebars.registerHelper("buildTitle", function(title, siteTitle){
	if (title.indexOf(siteTitle) < 0) {
    title = `'${title}' by ${siteTitle}`;
  }
  return title;
});
Handlebars.registerHelper("jointags", function(tags){
	return (tags || '').split(' ').join(',');
});

Metalsmith(__dirname)
  .use(define({
    site: {
      title: 'Marcus Noble',
      description: 'Awesomeness with a side of geek',
      url: 'https://marcusnoble.co.uk'
    }
  }))
  .use(date())
  .use(collections({
    posts: {
      pattern: 'posts/*',
      sortBy: 'date',
      reverse: true,
    },
    drafts: {
      pattern: 'drafts/*',
      sortBy: 'date',
      reverse: true,
    },
    projects: {
      pattern: 'projects/*'
    },
    pages: {
      pattern: 'pages/*'
    }
  }))
  .use(inplace({
    engine: 'handlebars',
    directory: 'templates',
    partials: 'templates/partials'
  }))
  .use(md)
  .use(permalinks({
    pattern: ':date-:title',
    date: 'YYYY-MM-DD',
    linksets: [
      {
        match: { collection: 'pages' },
        pattern: ':title'
      },
      {
        match: { collection: 'drafts' },
        pattern: 'drafts/:title'
      }
    ]
  }))
  .use(feed({
    collection: 'posts',
    destination: 'feed.xml'
  }))
  .use(sitemap({
    hostname: 'https://marcusnoble.co.uk',
    modifiedProperty: 'date'
  }))
  .use(pagination({
    'collections.posts': {
      perPage: 5,
      layout: 'index.html',
      first: 'index.html',
      noPageOne: true,
      path: 'page:num/index.html',
      pageMetadata: {
        title: 'Posts'
      }
    }
  }))
  .use(layouts({
    engine: 'handlebars',
    directory: 'templates',
    partials: 'templates/partials'
  }))
  .use(sass())
  .build(function(err) {
    if (err) throw err;

    app.listen(port, function () {
      console.log(`App listening at http://localhost:${port}`);
    });
  });
