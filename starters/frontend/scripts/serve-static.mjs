// Development preview only: serves exported files, with no application APIs.
import { createServer } from "node:http";
import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../out");
if (!existsSync(resolve(root, "index.html")))
  throw Error("Run npm run build before previewing the static export.");
const option = process.argv.indexOf("--port");
const port = Number(
  option >= 0 ? process.argv[option + 1] : (process.env.PORT ?? 3000),
);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".bcmap": "application/octet-stream",
};
createServer(async (req, res) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://static.invalid").pathname,
    );
    let file = resolve(root, "." + pathname);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    let info = await stat(file);
    if (info.isDirectory()) {
      file = resolve(file, "index.html");
      info = await stat(file);
    }
    if (!info.isFile()) throw Error();
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] ?? "application/octet-stream",
      "Content-Length": info.size,
    });
    if (req.method === "HEAD") res.end();
    else {
      const stream = createReadStream(file);
      stream.on("error", () => res.destroy());
      stream.pipe(res);
    }
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
}).listen(port, "0.0.0.0");
