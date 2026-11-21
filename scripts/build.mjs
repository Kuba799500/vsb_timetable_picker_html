import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import * as esbuild from "esbuild";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SRC = path.join(ROOT, "src");
const PUBLIC = path.join(ROOT, "public");
const TAILWIND_CONFIG = path.join(ROOT, "config", "tailwind.config.js");

console.log("🚀 Starting build...");
const startTime = Date.now();

// 1. Clean and ensure dist directory exists
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// 2. Compile CSS (in-memory) & bundle JS in parallel
const cssInputPath = path.join(SRC, "styles.css");
const cssSource = fs.readFileSync(cssInputPath, "utf8");

const compileCss = async () => {
    const postcssResult = await postcss([
        tailwindcss(TAILWIND_CONFIG),
        autoprefixer(),
    ]).process(cssSource, { from: cssInputPath });

    const minified = await esbuild.transform(postcssResult.css, {
        loader: "css",
        minify: true,
    });
    return minified.code;
};

const compileJs = async () => {
    const result = await esbuild.build({
        entryPoints: [path.join(SRC, "app.jsx")],
        bundle: true,
        minify: true,
        format: "iife",
        target: ["es2022"],
        write: false,
        legalComments: "none",
        alias: {
            "react": "preact/compat",
            "react-dom/client": "preact/compat/client",
            "react-dom": "preact/compat",
            "react/jsx-runtime": "preact/compat/jsx-runtime",
        },
    });
    return result.outputFiles[0].text;
};

const [minifiedCss, minifiedJs] = await Promise.all([compileCss(), compileJs()]);

// 3. Assemble single index.html in dist/
let html = fs.readFileSync(path.join(SRC, "index.html"), "utf8");
// Použít callback v replace(), jinak speciální sekvence jako $& v minifikovaném JS (např. Preact) rozbijí výstup
html = html.replace("<!-- STYLES -->", () => `<style>\n${minifiedCss}\n</style>`);
html = html.replace("<!-- SCRIPTS -->", () => `<script>\n${minifiedJs}\n</script>`);

const outHtmlPath = path.join(DIST, "index.html");
fs.writeFileSync(outHtmlPath, html, "utf8");

// 4. Copy static assets from public/ to dist/
if (fs.existsSync(PUBLIC)) {
    fs.cpSync(PUBLIC, DIST, {
        recursive: true,
        filter: (srcPath) => path.basename(srcPath) !== ".DS_Store",
    });
}

const stats = fs.statSync(outHtmlPath);
const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`✅ Build completed in ${elapsed}s! Output: dist/index.html (${(stats.size / 1024).toFixed(1)} KB)`);
