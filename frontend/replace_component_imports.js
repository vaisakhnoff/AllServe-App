const fs = require('fs');
const path = require('path');

const exactMappings = {
  '@/components/ui/AddressList': '@/components/user/AddressList',
  '@/components/ui/LocationSelector': '@/components/user/LocationSelector',
  '@/components/ui/ServicePricingModal': '@/components/provider/ServicePricingModal',
  '@/components/ui/ChatWindow': '@/components/messaging/ChatWindow',
  '@/components/dashboard/DashboardActivityRail': '@/components/user/DashboardActivityRail',
  '../../ui/AddressList': '../../user/AddressList',
  '../ui/AddressList': '../user/AddressList',
  '../../ui/LocationSelector': '../../user/LocationSelector',
  '../ui/LocationSelector': '../user/LocationSelector',
  '../../ui/ServicePricingModal': '../../provider/ServicePricingModal',
  '../ui/ServicePricingModal': '../provider/ServicePricingModal',
  '../../ui/ChatWindow': '../../messaging/ChatWindow',
  '../ui/ChatWindow': '../messaging/ChatWindow',
  '../dashboard/DashboardActivityRail': '../user/DashboardActivityRail',
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

  // First, do exact mappings for the files that moved to different domains
  for (const [oldImport, newImport] of Object.entries(exactMappings)) {
    const oldImportRegex = oldImport.replace(/\./g, '\\.');
    const regex = new RegExp(`(['"])${oldImportRegex}(['"])`, 'g');
    content = content.replace(regex, `$1${newImport}$2`);
  }

  // Then, globally replace any remaining `components/ui/` with `components/common/`
  // This covers Button, Input, Modal, etc.
  content = content.replace(/(['"])@\/components\/ui\//g, `$1@/components/common/`);
  content = content.replace(/(['"])\.\.\/ui\//g, `$1../common/`);
  content = content.replace(/(['"])\.\.\/\.\.\/ui\//g, `$1../../common/`);

  // Same for dashboard to user
  content = content.replace(/(['"])@\/components\/dashboard\//g, `$1@/components/user/`);
  content = content.replace(/(['"])\.\.\/dashboard\//g, `$1../user/`);
  content = content.replace(/(['"])\.\.\/\.\.\/dashboard\//g, `$1../../user/`);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated imports in ${filePath}`);
  }
}

walkDir('./src', replaceInFile);
