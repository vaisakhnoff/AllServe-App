const fs = require('fs');
const path = require('path');

const mappings = {
  '@/services/auth.service': '@/services/auth',
  '@/services/providerAuth.service': '@/services/auth',
  '@/services/booking.service': '@/services/booking',
  '@/services/provider.service': '@/services/provider',
  '@/services/providerQuote.service': '@/services/provider',
  '@/services/slot.service': '@/services/provider',
  '@/services/user.service': '@/services/user',
  '@/services/service.service': '@/services/service',
  '@/services/admin.service': '@/services/admin',
  '@/services/messaging.service': '@/services/messaging',
  '@/services/serviceRequest.service': '@/services/serviceRequest',
  '@/services/category.service': '@/services/category',
  
  // also handle relative imports within services directory if any exist
  './auth.service': './auth',
  './providerAuth.service': './auth',
  './booking.service': './booking',
  './provider.service': './provider',
  './providerQuote.service': './provider',
  './slot.service': './provider',
  './user.service': './user',
  './service.service': './service',
  './admin.service': './admin',
  './messaging.service': './messaging',
  './serviceRequest.service': './serviceRequest',
  './category.service': './category',
  
  // and handle parent relative paths just in case
  '../services/auth.service': '../services/auth',
  '../services/providerAuth.service': '../services/auth',
  '../services/booking.service': '../services/booking',
  '../services/provider.service': '../services/provider',
  '../services/providerQuote.service': '../services/provider',
  '../services/slot.service': '../services/provider',
  '../services/user.service': '../services/user',
  '../services/service.service': '../services/service',
  '../services/admin.service': '../services/admin',
  '../services/messaging.service': '../services/messaging',
  '../services/serviceRequest.service': '../services/serviceRequest',
  '../services/category.service': '../services/category',
};

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
  
  // Replace imports
  for (const [oldImport, newImport] of Object.entries(mappings)) {
    // Escape dots for regex
    const oldImportRegex = oldImport.replace(/\./g, '\\.');
    // Match exact import path in quotes
    const regex = new RegExp(`(['"])${oldImportRegex}(['"])`, 'g');
    content = content.replace(regex, `$1${newImport}$2`);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  }
}

walkDir('./src', replaceInFile);
