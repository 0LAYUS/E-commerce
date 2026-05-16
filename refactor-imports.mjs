import fs from 'fs';
import path from 'path';

const dirsToScan = ['app', 'components', 'lib', 'src'];
const rootDir = process.cwd();

const replacements = [
  { from: /@\/lib\/cart\/cartValidator/g, to: '@/features/cart/services/cartValidator' },
  { from: /@\/lib\/email\/orderConfirmation/g, to: '@/features/orders/services/orderConfirmation' },
  { from: /@\/lib\/license\/sign-request/g, to: '@/shared/utils/sign-request' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const rule of replacements) {
        content = content.replace(rule.from, rule.to);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

dirsToScan.forEach(dir => processDir(path.join(rootDir, dir)));
console.log("Done refactoring imports.");
