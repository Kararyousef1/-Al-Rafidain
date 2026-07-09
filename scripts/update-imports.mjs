import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const srcRoot = path.join(projectRoot, "src");

const args = process.argv.slice(2);

const source = args.find(a => a.startsWith("--from="))?.replace("--from=", "");
const destination = args.find(a => a.startsWith("--to="))?.replace("--to=", "");
const dryRun = args.includes("--dry-run");

if (!source || !destination) {
    console.log(`
Usage:

node scripts/update-imports.mjs --from=components --to=shared/components

Examples:

node scripts/update-imports.mjs --from=store --to=core/stores
node scripts/update-imports.mjs --from=constants --to=core/constants
node scripts/update-imports.mjs --from=types --to=shared/types
node scripts/update-imports.mjs --from=hooks --to=shared/hooks
node scripts/update-imports.mjs --from=lib --to=services
node scripts/update-imports.mjs --from=sdk --to=services/sdk
`);
    process.exit(0);
}

const files = [];

function scan(dir) {
    if (!fs.existsSync(dir)) return;

    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {

        const full = path.join(dir, item.name);

        if (item.isDirectory()) {
            scan(full);
            continue;
        }

        if (
            item.name.endsWith(".ts") ||
            item.name.endsWith(".tsx") ||
            item.name.endsWith(".js") ||
            item.name.endsWith(".jsx")
        ) {
            files.push(full);
        }
    }
}

scan(srcRoot);

const importRegex =
/(from\s+['"]([^'"]+)['"])|(import\(['"]([^'"]+)['"]\))|(React\.lazy\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)\))|(vi\.mock\(['"]([^'"]+)['"]\))/g;

let filesChanged = 0;
let importsChanged = 0;

for (const file of files) {

    const dir = path.dirname(file);

    let text = fs.readFileSync(file, "utf8");

    let changed = false;

    text = text.replace(importRegex, (...m) => {

        const oldPath =
            m[2] ||
            m[4] ||
            m[6] ||
            m[8];

        if (!oldPath) return m[0];

        if (!oldPath.includes(source))
            return m[0];

        const after = oldPath.substring(
            oldPath.indexOf(source) + source.length
        );

        const absolute = path.join(srcRoot, destination, after);

        let relative = path.relative(dir, absolute);

        relative = relative.replace(/\\/g, "/");

        if (!relative.startsWith("."))
            relative = "./" + relative;

        importsChanged++;
        changed = true;

        return m[0].replace(oldPath, relative);

    });

    if (changed) {

        filesChanged++;

        if (!dryRun)
            fs.writeFileSync(file, text);

        console.log(
            `${dryRun ? "[DRY]" : "[FIX]"} ${path.relative(srcRoot, file)}`
        );

    }

}

console.log("\n==========================");
console.log("Update finished");
console.log("==========================");
console.log("Source      :", source);
console.log("Destination :", destination);
console.log("Files       :", filesChanged);
console.log("Imports     :", importsChanged);
console.log("Mode        :", dryRun ? "DRY RUN" : "WRITE");
console.log("==========================");