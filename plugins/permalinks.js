const path = require("path");
const fs = require("fs");

/**
 * Custom Metalsmith permalinks plugin.
 * Preserves source directory structure for posts, applies custom patterns for pages.
 */
function permalinks(options) {
  const defaultOptions = {
    pattern: ":date-:title",
    date: {
      format: "YYYY-MM-DD",
      locale: "en",
    },
    linksets: [],
    slug: {
      lowercase: true,
      remove: /[<>:"'\|?*]|[^\w\s$_+~.()!\-@\/]+/g,
      extend: { ":": "-", "|": "-", "/": "-", "<": "", ">": "" },
    },
    trailingSlash: false,
    directoryIndex: "index.html",
  };

  const opts = { ...defaultOptions, ...options };

  function formatDate(date) {
    if (!date || !(date instanceof Date)) return "";
    const d = date;
    const format = opts.date.format || "YYYY-MM-DD";
    return format
      .replace("YYYY", d.getFullYear())
      .replace("MM", String(d.getMonth() + 1).padStart(2, "0"))
      .replace("DD", String(d.getDate()).padStart(2, "0"))
      .replace("D", String(d.getDate()))
      .replace("H", String(d.getHours()).padStart(2, "0"))
      .replace("m", String(d.getMinutes()).padStart(2, "0"))
      .replace("s", String(d.getSeconds()).padStart(2, "0"));
  }

  function slugify(str) {
    if (!str) return "";
    let s = str.toString();
    if (opts.slug.lowercase) s = s.toLowerCase();
    if (opts.slug.extend) {
      for (const [from, to] of Object.entries(opts.slug.extend)) {
        s = s.split(from).join(to);
      }
    }
    // Replace spaces with dashes and remove special chars
    s = s.replace(/\s+/g, "-");
    if (opts.slug.remove) {
      s = s.replace(new RegExp(opts.slug.remove, "g"), "");
    }
    return s;
  }

  function replacePattern(pattern, data) {
    return pattern.replace(/:(\w+)(\??)/g, (match, key, optional) => {
      let value = data[key];
      if (value === undefined || value === null) {
        if (optional) return "";
        throw new Error(
          `Could not substitute ':${key}' in pattern '${pattern}', '${key}' is undefined`
        );
      }
      // For date in permalink, use _filenameDate if available (to avoid collisions
      // when front matter date differs from filename date)
      if (key === 'date' && data._filenameDate) {
        return formatDate(data._filenameDate);
      }
      if (value instanceof Date) {
        return formatDate(value);
      }
      return slugify(value.toString()).replace(/-+/, "-");
    });
  }

  function getMatchedLinkset(data, linksets) {
    for (const linkset of linksets) {
      if (linkset.match) {
        let matched = false;
        for (const [key, val] of Object.entries(linkset.match)) {
          const fileVal = data[key];
          if (Array.isArray(fileVal)) {
            if (fileVal.includes(val)) {
              matched = true;
            }
          } else if (fileVal === val) {
            matched = true;
          } else {
            matched = false;
            break;
          }
        }
        if (matched) return linkset;
      }
    }
    return null;
  }

  return function (files, metalsmith, done) {
    const keys = Object.keys(files);

    for (const file of keys) {
      const data = files[file];

      // Skip non-HTML files
      if (!file.endsWith(".html")) continue;

      // Skip if permalink is explicitly disabled
      if (data.permalink === false) continue;

      // Skip if this is a layout/template file (has layout that matches filename)
      // e.g., index.html with layout: 'index.html' should not be permalinked
      const baseName = path.basename(file, '.html');
      if (data.layout === baseName || data.layout === `${baseName}.html`) continue;

      // Determine which linkset to use (or default)
      const linkset = getMatchedLinkset(data, opts.linksets) || opts;
      const pattern = linkset.pattern || opts.pattern;

      // Check file-specific permalink first
      if (data.permalink) {
        data.permalink = replacePattern(data.permalink, data);
        if (opts.trailingSlash) data.permalink = data.permalink.replace(/\/+$/, "");
        continue;
      }


      let sourcePrefix = "";

      // Replace pattern placeholders
      let result = replacePattern(pattern, data);

      // Remove trailing slashes if not desired
      if (!opts.trailingSlash) {
        result = result.replace(/\/+$/, "");
      }

      // Add directory index
      if (path.extname(result) === "" || path.extname(result) === ".html") {
        if (!path.extname(result)) {
          result = path.join(result, opts.directoryIndex);
        }
      }

      data.permalink = result;

      // Set path metadata for templates (permalink without index.html)
      if (data.permalink.endsWith("/index.html")) {
        data.path = data.permalink.replace(/\/index\.html$/, "");
      } else if (path.extname(data.permalink) === ".html") {
        data.path = data.permalink.replace(/\.html$/, "");
      } else {
        data.path = data.permalink;
      }
    }

    // Now rename files based on permalink metadata
    const renames = [];
    for (const [file, data] of Object.entries(files)) {
      if (!data.permalink) continue;
      if (data.permalink === file) continue; // No change needed

      renames.push([file, data.permalink]);
    }

    for (const [oldName, newName] of renames) {
      // Create target directory if needed
      const targetDir = path.dirname(newName);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      // Move file
      files[newName] = files[oldName];
      delete files[oldName];
    }

    done();
  };
}

module.exports = permalinks;
