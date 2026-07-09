import fs from "fs";
import path from "path";

const root = path.resolve("src");
const sharedRoot = path.join(root, "shared", "components");

const exts = [".ts", ".tsx"];

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      files = files.concat(walk(full));
    } else if (exts.includes(path.extname(item.name))) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(sharedRoot);

let fixed = 0;
let updatedFiles = 0;

for (const file of files) {
  let code = fs.readFileSync(file, "utf8");
  let original = code;

  code = code.replace(
    /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
    (_, start, importPath, end) => {
      // نتجاهل الحزم الخارجية
      if (!importPath.startsWith(".")) return _;

      const oldDir = path.join(root, "components");
      const oldFile = path.relative(sharedRoot, file);

      const oldLocation = path.join(oldDir, oldFile);

      const target = path.normalize(
        path.resolve(path.dirname(oldLocation), importPath)
      );

      let relative = path.relative(path.dirname(file), target);

      relative = relative.replace(/\\/g, "/");

      if (!relative.startsWith(".")) {
        relative = "./" + relative;
      }

      fixed++;
      return `${start}${relative}${end}`;
    }
  );

  if (code !== original) {
    fs.writeFileSync(file, code);
    updatedFiles++;
    console.log("Updated:", path.relative(root, file));
  }
}

console.log("");
console.log("====================================");
console.log("Files Updated :", updatedFiles);
console.log("Imports Fixed :", fixed);
console.log("====================================");