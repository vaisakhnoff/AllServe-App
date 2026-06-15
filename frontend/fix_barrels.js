const fs = require('fs');

const barrels = {
  'auth': ['auth.service', 'providerAuth.service'],
  'booking': ['booking.service'],
  'provider': ['provider.service', 'providerQuote.service', 'slot.service'],
  'user': ['user.service'],
  'service': ['service.service'],
  'admin': ['admin.service'],
  'messaging': ['messaging.service'],
  'serviceRequest': ['serviceRequest.service'],
  'category': ['category.service'],
};

for (const [folder, files] of Object.entries(barrels)) {
  const indexPath = `src/services/${folder}/index.ts`;
  let content = '';
  for (const file of files) {
    content += `export * from './${file}';\n`;
  }
  fs.writeFileSync(indexPath, content);
  console.log(`Fixed ${indexPath}`);
}
