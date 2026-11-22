"use strict";
const fs = require("fs");
const path = require("path");
const express = require("express");
const compress = require("compression");
const Metalsmith = require("metalsmith");
const matter = require("gray-matter");
const inPlace = require("@metalsmith/in-place");
const layouts = require("@metalsmith/layouts");
const markdown = require("@metalsmith/markdown");
const permalinks = require("./plugins/permalinks");
const collections = require("@metalsmith/collections");
const pagination = require("metalsmith-pagination");
const define = require("metalsmith-define");
const sitemap = require("metalsmith-sitemap");
const Handlebars = require("handlebars");
const moment = require("moment");
const striptags = require("striptags");
const { marked } = require("marked");
const RSS = require("rss");
const sass = require("sass");

const port = process.env.PORT || 8000;

const app = express();

app.disable("x-powered-by");
app.use(compress());
app.use(express.static(__dirname + "/build"));

// Lets try and slow down some of those exploit crawlers
app.use("/", require("./filterRoutes"));

// Redirects
app.use("/", require("./redirects"));

// Handle some iOS icon 404s
app.get("/apple-touch-icon*", function (req, res) {
  res.sendFile(__dirname + "/build/images/favico/" + req.url, () => {
    res.sendFile(__dirname + "/build/images/favico/apple-touch-icon.png");
  });
});
app.get("/images/favico/*.png", function (req, res) {
  res.sendFile(__dirname + "/build/images/favico/apple-touch-icon.png");
});

app.get("/favicon.png", function (req, res) {
  res.sendFile(__dirname + "/build/images/favico/apple-touch-icon.png");
});

app.get("/robots.txt", function (req, res) {
  res.send("User-agent: * Disallow: ");
});

app.get(
  /\/(feeds?|rss|atom)\/?|feed\.xml|rss\.xml|index\.rss|feed\.rss$/,
  function (req, res) {
    res.redirect(301, "/feed.xml");
  }
);

app.get(/.+\/manifest\.json$/, function (req, res) {
  res.redirect(301, "/manifest.json");
});

app.get("/healthz", function (req, res) {
  res.sendStatus(200);
});

// --- Markdown renderer setup ---
marked.setOptions({
  gfm: true,
  breaks: true,
});

const renderer = new marked.Renderer();

// Custom table renderer to add role="grid" (matches original behavior)
const originalTable = renderer.table.bind(renderer);
renderer.table = function (e) {
  let result = originalTable(e);
  return result.replace("<table>", '<table role="grid">');
};

const customRenderer = (source, _opts, _context) => {
  return marked.parse(source, { renderer });
};

// --- Handlebars helpers ---
Handlebars.registerHelper("markdown", function (text) {
  if (!text) return;
  return customRenderer(text, {}, {});
});
Handlebars.registerHelper("moment", function (date, format) {
  return new moment(date).format(format);
});
Handlebars.registerHelper("striptags", function (text) {
  return striptags(text);
});
Handlebars.registerHelper("buildTitle", function (title, siteTitle) {
  if (title.indexOf(siteTitle) < 0) {
    title = "'" + title + "' by " + siteTitle;
  }
  return title;
});
Handlebars.registerHelper("jointags", function (tags) {
  return (tags || "").split(" ").join(",");
});
Handlebars.registerHelper("encodetitle", function (str) {
  return (str || "").replaceAll(" ", "%2B");
});

// --- Pre-build: Compile SCSS to CSS ---
function compileSass(sourceDir, outputDir) {
  const cssDir = path.join(sourceDir, "src", "css");
  const outputCssDir = path.join(outputDir, "css");

  if (!fs.existsSync(cssDir)) {
    console.warn("No CSS source directory found, skipping SCSS compilation");
    return;
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputCssDir)) {
    fs.mkdirSync(outputCssDir, { recursive: true });
  }

  const files = fs.readdirSync(cssDir);
  fs.mkdirSync(outputCssDir, { recursive: true });

  for (const file of files) {
    if (!file.endsWith(".scss") || file.startsWith("_")) continue; // Skip partials

    const inputPath = path.join(cssDir, file);
    const outputFileName = file.replace(/\.scss$/, ".css");
    const outputPath = path.join(outputCssDir, outputFileName);

    console.log(`Compiling SCSS: ${file} -> ${outputFileName}`);
    try {
      const result = sass.compile(inputPath, {
        style: "compressed",
      });
      fs.writeFileSync(outputPath, result.css);
    } catch (err) {
      console.error(`Failed to compile ${file}:`, err.message);
      throw err;
    }
  }
}

// --- Feed generation plugin ---
function feedPlugin() {
  return function (files, metalsmith, done) {
    const posts = metalsmith.metadata().collections.posts || [];

    const feed = new RSS({
      title: "Marcus Noble",
      description:
        "The blog of Marcus Noble, self-described tinkerer, platform engineer and all round average guy!",
      site_url: "https://marcusnoble.co.uk",
      feed_url: "https://marcusnoble.co.uk/feed.xml",
      image_url: "https://marcusnoble.co.uk/images/marcus.jpg",
      language: "en",
    });

    posts.forEach((post) => {
      const postUrl = `https://marcusnoble.co.uk/${post.path}/`;

      const contentKey = post.path + '/index.html';
      let renderedContent = "";
      if (files[contentKey]) {
        const fullHtml = files[contentKey].contents.toString();
        const articleMatch = fullHtml.match(/<div class="post-body"[^>]*>([\s\S]*?)<\/div/i);
        renderedContent = articleMatch ? articleMatch[1].trim() : fullHtml;
      }

      feed.item({
        title: post.title,
        url: postUrl,
        guid: postUrl,
        date: post.date.toISOString(),
        description: renderedContent || post.summary || "",
        categories: (post.tags || "").split(" ").filter(Boolean),
      });
    });

    files["feed.xml"] = {
      contents: Buffer.from(feed.xml({ indent: true })),
      modified: new Date(),
    };

    done();
  };
}

// --- Handlebars partials preprocessor ---
// Processes {{> partial }} calls in markdown files before markdown rendering
function handlebarsPreprocessor() {
  return function (files, metalsmith, done) {
    const templateDir = path.join(metalsmith.directory(), "templates");
    const partialsDir = path.join(templateDir, "partials");

    // Load all partials
    const hbs = Handlebars.create();
    hbs.registerHelper("markdown", function (text) {
      if (!text) return "";
      return customRenderer(text, {}, {});
    });
    hbs.registerHelper("moment", function (date, format) {
      return new moment(date).format(format);
    });
    hbs.registerHelper("striptags", striptags);
    hbs.registerHelper("buildTitle", function (title, siteTitle) {
      if (title.indexOf(siteTitle) < 0) {
        title = "'" + title + "' by " + siteTitle;
      }
      return title;
    });
    hbs.registerHelper("jointags", function (tags) {
      return (tags || "").split(" ").join(",");
    });
    hbs.registerHelper("encodetitle", function (str) {
      return (str || "").replaceAll(" ", "%2B");
    });

    // Register all partials
    if (fs.existsSync(partialsDir)) {
      const partialFiles = fs.readdirSync(partialsDir);
      for (const file of partialFiles) {
        const name = path.parse(file).name;
        const content = fs.readFileSync(path.join(partialsDir, file), "utf8");
        hbs.registerPartial(name, content);
      }
    }

    // Find markdown files with partial references and process them
    const filesToProcess = Object.keys(files).filter((file) =>
      file.endsWith(".md") || file.endsWith(".markdown")
    );

    for (const file of filesToProcess) {
      const content = files[file].contents.toString();
      const handlebarsRegex = /\{\{\s*>\s*(\w+)\s+([^}]*)\s*\}\}/g;
      const matches = [...content.matchAll(handlebarsRegex)];

      if (matches.length > 0) {
        let processed = content;
        for (const match of matches) {
          const partialName = match[1];
          const argsStr = match[2];
          // Parse arguments: name="value" name="value" ...
          const args = {};
          const argRegex = /(\w+)=["']([^"']*)["']/g;
          let argMatch;
          while ((argMatch = argRegex.exec(argsStr)) !== null) {
            args[argMatch[1]] = argMatch[2];
          }
          try {
            const partial = hbs.partials[partialName];
            if (partial) {
              const rendered = hbs.compile(partial)(args);
              processed = processed.replace(match[0], rendered);
            }
          } catch (e) {
            console.warn(
              `Warning: Could not render partial ${partialName} in ${file}`
            );
          }
        }
        files[file].contents = Buffer.from(processed);
      }
    }

    // Extract date and title from filename for permalinks compatibility
    // The filename date is the primary source for the permalink
    const postPattern = /^posts\/(\d{4}-\d{2}-\d{2})-(.+)\.(md|markdown)$/;
    for (const file of Object.keys(files)) {
      const match = file.match(postPattern);
      if (match) {
        const [, dateStr, titleSlug] = match;
        // Use filename date for permalink (via _filenameDate), but front matter date for other purposes
        // Store filename-based date for permalinks
        if (!files[file]._filenameDate) {
          files[file]._filenameDate = new Date(dateStr);
        }
        // Also store the filename-based title slug for permalinks
        if (!files[file]._filenameTitle) {
          files[file]._filenameTitle = titleSlug;
        }
        // Set the title from front matter (or derive from filename)
        if (!files[file].title) {
          // Convert slug to title: "some-title-slug" -> "Some Title Slug"
          files[file].title = titleSlug
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        }
      }
      // Set default date for files without one (e.g., index.html from pagination, pages)
      if (!files[file].date) {
        files[file].date = new Date();
      }
    }

    done();
  };
}

// --- Metalsmith build pipeline ---
// Pre-build: Compile SCSS to CSS and write to build directory
compileSass(__dirname, path.join(__dirname, "build"));

const ms = Metalsmith(__dirname)
  .ignore(['**/*.scss']) // Don't copy SCSS source files to build
  .clean(false) // Don't clean build directory (pre-build SCSS compilation outputs preserved)
  .source("src")
  .use(
    define({
      site: {
        title: "Marcus Noble",
        description:
          "The blog of Marcus Noble, self-described tinkerer, platform engineer and all round average guy!",
        url: "https://marcusnoble.co.uk",
      },
    })
  )
  .use(function (files, metalsmith, done) {
    const now = new Date();
    const meta = metalsmith.metadata();
    meta.buildDate = now;
    meta.buildTimestamp = now.toISOString();
    done();
  })
  .use(
    collections({
      posts: {
        pattern: "posts/*.{md,markdown}",
        sort: "date:desc",
      },
      drafts: {
        pattern: "drafts/*.{md,markdown}",
        sort: "date:desc",
      },
      projects: {
        pattern: "projects/*",
      },
      pages: {
        pattern: "pages/*",
      },
    })
  )
  .use(function (files, metalsmith, done) {
    // Extract YAML front matter from all markdown files
    Object.keys(files).forEach(function (file) {
      if (file.endsWith(".md") || file.endsWith(".markdown")) {
        const content = files[file].contents.toString();
        const parsed = matter(content);
        // Update file content to body (without front matter)
        files[file].contents = Buffer.from(parsed.content);
        // Extract front matter as file metadata
        if (parsed.data) {
          Object.assign(files[file], parsed.data);
        }
      }
    });
    done();
  })
  .use(handlebarsPreprocessor())
  .use(
    markdown({
      render: customRenderer,
    })
  )
  .use(
    pagination({
      "collections.posts": {
        perPage: 25,
        layout: "index.html",
        first: "index.html",
        noPageOne: true,
        path: "page:num/index.html",
        pageMetadata: {
          title: "Posts",
        },
      },
    })
  )
  .use(function (files, metalsmith, done) {
    // Pre-compute paths for layouts rendering
    // This mirrors the permalinks logic but doesn't rename files
    const slugRe = /[<>:"'\|?*]|[^\w\s$_+~.()!\-@]+/g;
    const linksets = [
      { match: { collection: "pages" }, pattern: ":title" },
      { match: { collection: "drafts" }, pattern: "drafts/:title" },
    ];
    for (const file of Object.keys(files)) {
      const data = files[file];

      // Set default date
      if (!data.date) {
        data.date = new Date();
      }

      // Skip non-HTML files
      if (!file.endsWith(".html")) continue;
      if (data.permalink === false) continue;

      // Skip layout files (layout matches filename)
      const baseName = path.basename(file, ".html");
      // Don't skip index.html - it already has permalink from pagination
      if (file === "index.html") {
        // Set path for index page (root URL)
        data.path = "";
        continue;
      }
      if (data.layout === baseName || data.layout === `${baseName}.html`) continue;

      // Determine linkset
      let linkset = null;
      for (const ls of linksets) {
        if (ls.match) {
          let matched = true;
          for (const [key, val] of Object.entries(ls.match)) {
            const fileVal = data[key];
            if (Array.isArray(fileVal)) {
              if (!fileVal.includes(val)) { matched = false; break; }
            } else if (fileVal !== val) { matched = false; break; }
          }
          if (matched) { linkset = ls; break; }
        }
      }
      const pattern = linkset ? (linkset.pattern || ":date-:title") : ":date-:title";

      // Compute permalink
      let result = pattern
        .replace(/:(\w+)(\??)/g, (match, key, optional) => {
          let value = data[key];
          if (value === undefined || value === null) {
            if (optional) return "";
            return key;
          }
          if (key === "date" && data._filenameDate) {
            const d = data._filenameDate;
            return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
          }
          if (value instanceof Date) {
            const d = value;
            return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
          }
          return String(value).toLowerCase().replace(/\s+/g, "-").replace(slugRe, "").replace(/-+/g, "-");
        })
        .replace(/\/+$/, "");

      // Add directory index - force index.html for permalinks without .html extension
      // Dots in titles (like T.I.L.) confuse path.extname() so we check the actual extension
      if (!result.endsWith(".html")) {
        result = path.join(result, "index.html");
      }

      // Post files: no prefix - URLs match production format /YYYY-MM-DD-slug/
      data.permalink = result;

      // Set path for templates (permalink without index.html)
      if (data.permalink.endsWith("/index.html")) {
        data.path = data.permalink.replace(/\/index\.html$/, "");
      } else if (path.extname(data.permalink) === ".html") {
        data.path = data.permalink.replace(/\.html$/, "");
      } else {
        data.path = data.permalink;
      }
    }
    done();
  })
  .use(
    layouts({
      transform: require("./plugins/handlebars-html"),
      directory: "templates",
      pattern: "**/*.html",
      extname: ".html",
    })
  )
  .use(
    permalinks({
      pattern: ":date-:title",
      date: "YYYY-MM-DD",
      linksets: [
        {
          match: { collection: "pages" },
          pattern: ":title"
        },
        {
          match: { collection: "drafts" },
          pattern: "drafts/:title"
        }
      ]
    })
  )
  .use(
    sitemap({
      hostname: "https://marcusnoble.co.uk",
      omitExtension: true,
    })
  )
  .use(feedPlugin());

// Run the build
ms.build(function (err) {
  if (err) {
    console.error("Build failed:", err);
    throw err;
  }

  console.log("Build complete. Starting server...");

  app.listen(port, function () {
    console.log(`App listening at http://localhost:${port}`);
  });
});
