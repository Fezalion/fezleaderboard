// GitHub Pages has no rewrites, but it serves 404.html for any unknown path.
// Copying index.html there makes /mirage load the app, which then reads the path.
import { copyFileSync } from "node:fs";

copyFileSync("dist/index.html", "dist/404.html");
console.log("dist/404.html written");
