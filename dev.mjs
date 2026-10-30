import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { execSync } from "node:child_process";

const PORT = 3000;
const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const SRC = path.join(ROOT, "src");

// MIME types
const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
};

function runBuild() {
    try {
        console.log("🔄 Rebuilding...");
        execSync("node build.mjs", { stdio: "inherit" });
    } catch (err) {
        console.error("❌ Build error:", err.message);
    }
}

// Initial build
runBuild();

// Static file server
const server = http.createServer((req, res) => {
    let reqPath = req.url.split("?")[0];
    if (reqPath.startsWith("/vsb_timetable_picker_html/")) {
        reqPath = reqPath.replace("/vsb_timetable_picker_html/", "/");
    }
    if (reqPath === "/" || reqPath === "") {
        reqPath = "/index.html";
    }

    const filePath = path.join(DIST, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("404 Not Found");
    }
});

server.listen(PORT, () => {
    console.log(`\n🌐 Dev server running at: http://localhost:${PORT}`);
    console.log(`👀 Watching src/ for changes...\n`);
});

// Watch src/
let debounceTimer = null;
fs.watch(SRC, { recursive: true }, (eventType, filename) => {
    if (filename) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            console.log(`\n📝 Change detected in src/${filename}`);
            runBuild();
        }, 150);
    }
});

