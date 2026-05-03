const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..', '..');
const outputPath = path.join(repoRoot, 'dead', 'JSON', 'repo-index.json');
const ignoredDirectoryNames = new Set([
  '.git',
  '.github',
  '.vscode',
  '__pycache__',
  'node_modules'
]);

function toWebPath(filePath) {
  const relativePath = path.relative(repoRoot, filePath).split(path.sep).join('/');
  return `/${relativePath}/`;
}

function walkDirectories(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const folders = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || ignoredDirectoryNames.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    folders.push(fullPath, ...walkDirectories(fullPath));
  }

  return folders;
}

function readExistingIndex() {
  try {
    return JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch (error) {
    return null;
  }
}

function arraysEqual(left, right) {
  return Array.isArray(left)
    && Array.isArray(right)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

const folders = ['/', ...walkDirectories(repoRoot).map(toWebPath)]
  .sort((a, b) => {
    if (a === '/') return -1;
    if (b === '/') return 1;
    return a.localeCompare(b);
  });

const existingIndex = readExistingIndex();
if (arraysEqual(existingIndex && existingIndex.folders, folders)) {
  console.log(`No folder changes for ${path.relative(repoRoot, outputPath)}.`);
  process.exit(0);
}

const index = {
  generatedAt: new Date().toISOString(),
  folders
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

console.log(`Wrote ${path.relative(repoRoot, outputPath)} with ${folders.length} folders.`);
