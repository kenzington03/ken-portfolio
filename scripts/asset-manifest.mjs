// Lists every file under public/assets into src/data/publicAssets.json, so the
// project viewers know which images exist without downloading guesses one at
// a time. Runs before every build (npm run build); run it by hand after
// adding or removing project files during development.
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = 'public';
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(`/${relative(root, full).split(sep).join('/')}`);
  }
};
walk(join(root, 'assets'));
files.sort();
writeFileSync('src/data/publicAssets.json', `${JSON.stringify(files, null, 0)}\n`);
console.log(`asset manifest: ${files.length} files`);
