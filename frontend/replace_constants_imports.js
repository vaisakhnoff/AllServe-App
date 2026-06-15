const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
        callback(dirPath);
      }
    }
  });
}

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace @/constants/ to @/shared/
  content = content.replace(/(['"])@\/constants\//g, `$1@/shared/`);
  // Also handle relative imports if any
  content = content.replace(/(['"])\.\.\/constants\//g, `$1../shared/`);
  content = content.replace(/(['"])\.\.\/\.\.\/constants\//g, `$1../../shared/`);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  }
}

walkDir('./src', replaceInFile);
