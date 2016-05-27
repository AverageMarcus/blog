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
const Handlebars = require('handlebars');
const emoji = require('markdown-it-emoji');
const moment = require('moment');

const port = process.env.PORT || 8000;
const oneDay = 86400000;

app.use(compress());
app.use(express.static(__dirname + '/build', {maxAge: oneDay}));

var md = markdown('commonmark', {html: true});
md.parser.use(emoji);

Handlebars.registerHelper('markdown', function(text) {
  return md.parser.render(text);
});
Handlebars.registerHelper('moment', function(date, format) {
  return new moment(date).format(format);
});


Metalsmith(__dirname)
  .use(define({
    site: {
      title: 'Marcus Noble',
      description: 'Awesomeness with a side of geek',
      url: 'https://blog.marcusnoble.co.uk'
    }
  }))
  .use(collections({
    posts: {
      pattern: 'posts/*',
      sortBy: 'date',
      reverse: true,
    },
    projects: {
      pattern: 'projects/*'
    },
    pages: {
      pattern: 'pages/*'
    },
    experience: {
      pattern: 'experience/*',
      sortBy: 'start',
      reverse: true
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
      }
    ]
  }))
  .use(feed({
    collection: 'posts',
    destination: 'feed.xml'
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
      console.log(`App listening on port ${port}`);
    });
  });
