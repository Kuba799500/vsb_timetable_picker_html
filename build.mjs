import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import * as esbuild from "esbuild";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SRC = path.join(ROOT, "src");

console.log("🚀 Starting build...");
const startTime = Date.now();

// 1. Ensure dist directory exists
if (!fs.existsSync(DIST)) {
    fs.mkdirSync(DIST, { recursive: true });
}

// 2. Compile Tailwind CSS
console.log("🎨 Compiling Tailwind CSS...");
const tempCssPath = path.join(DIST, "temp.css");
execSync(`npx tailwindcss -i "${path.join(SRC, "styles.css")}" -o "${tempCssPath}" --minify`, {
    stdio: "inherit"
});
const minifiedCss = fs.readFileSync(tempCssPath, "utf8");
fs.unlinkSync(tempCssPath);

// 3. Bundle & minify JS with esbuild
console.log("⚡ Bundling JavaScript with esbuild...");
const esbuildResult = await esbuild.build({
    entryPoints: [path.join(SRC, "app.jsx")],
    bundle: true,
    minify: true,
    format: "iife",
    target: ["es2020"],
    write: false,
    legalComments: "none",
});
const minifiedJs = esbuildResult.outputFiles[0].text;

// 4. Assemble single index.html
console.log("📦 Assembling single-file HTML...");
let html = fs.readFileSync(path.join(SRC, "index.html"), "utf8");
html = html.replace("<!-- STYLES -->", `<style>\n${minifiedCss}\n</style>`);
html = html.replace("<!-- SCRIPTS -->", `<script>\n${minifiedJs}\n</script>`);

const outHtmlPath = path.join(DIST, "index.html");
fs.writeFileSync(outHtmlPath, html, "utf8");

// Also update root index.html so direct opening or repository download always has the working built file
fs.writeFileSync(path.join(ROOT, "index.html"), html, "utf8");

// 5. Copy static assets to dist/
console.log("📋 Copying static assets to dist/...");
const staticFiles = ["bookmarklet.js", "icon.svg", "apple-touch-icon.png", "README.md"];
for (const file of staticFiles) {
    const srcPath = path.join(ROOT, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(DIST, file));
    }
}

const stats = fs.statSync(outHtmlPath);
const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n✅ Build completed in ${elapsed}s!`);
console.log(`📄 Output: dist/index.html (${(stats.size / 1024).toFixed(1)} KB)`);

