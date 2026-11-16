const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const moment = require("moment");
const striptags = require("striptags");
const { marked } = require("marked");

// Setup marked renderer
marked.setOptions({ gfm: true, breaks: true });
const renderer = new marked.Renderer();
const originalTable = renderer.table.bind(renderer);
renderer.table = function (e) {
  let result = originalTable(e);
  return result.replace("<table>", '<table role="grid">');
};

// Register helpers on Handlebars
Handlebars.registerHelper("markdown", function (text) {
  if (!text) return "";
  return marked.parse(text, { renderer });
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

// Load all partials from templates/partials directory
const partialsDir = path.join(__dirname, "..", "templates", "partials");
if (fs.existsSync(partialsDir)) {
  fs.readdirSync(partialsDir).forEach((file) => {
    const name = path.parse(file).name;
    const content = fs.readFileSync(path.join(partialsDir, file), "utf8");
    Handlebars.registerPartial(name, content);
  });
}

// Compile a template file (used by renderFileAsync)
function compile(filePath) {
  const template = fs.readFileSync(filePath, "utf8");
  return {
    fn: Handlebars.compile(template),
    dependencies: [],
  };
}

// Render a template string with locals
function render(templateStr, opts, locals) {
  const template = Handlebars.compile(templateStr);
  const output = template(locals);
  return { body: output, dependencies: [] };
}

// Render a template file with locals
async function renderFileAsync(filePath, opts, locals) {
  const template = fs.readFileSync(filePath, "utf8");
  const compiled = Handlebars.compile(template);
  const output = compiled(locals);
  return { body: output, dependencies: [] };
}

// Assemble the jstransformer interface
const jstransformer = {
  name: "handlebars",
  inputFormats: ["hbs", "handlebars", "html"],
  outputFormat: "html",
  compile: function (templateStr) {
    const compiled = Handlebars.compile(templateStr);
    return { fn: compiled, dependencies: [] };
  },
  render: function (templateStr, opts, locals) {
    return render(templateStr, opts, locals);
  },
  renderAsync: async function (templateStr, opts, locals) {
    return render(templateStr, opts, locals);
  },
  renderFileAsync: async function (filePath, opts, locals) {
    return renderFileAsync(filePath, opts, locals);
  },
  registerPartial: Handlebars.registerPartial.bind(Handlebars),
  registerHelper: Handlebars.registerHelper.bind(Handlebars),
  partials: Handlebars.partials,
  helpers: Handlebars.helpers,
};

module.exports = jstransformer;
