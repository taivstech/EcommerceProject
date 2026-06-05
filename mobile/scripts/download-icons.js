const fs = require('fs');
const path = require('path');
const https = require('https');

const icons = [
  {
    url: 'https://img.icons8.com/ios-glyphs/90/000000/shopping-cart.png',
    dest: 'cart.png'
  },
  {
    url: 'https://img.icons8.com/ios-glyphs/90/000000/user.png',
    dest: 'profile.png'
  }
];

const targetDir = path.join(__dirname, '..', 'assets', 'images', 'tabIcons');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded to ${destPath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  for (const icon of icons) {
    const mainPath = path.join(targetDir, icon.dest);
    const path2x = path.join(targetDir, icon.dest.replace('.png', '@2x.png'));
    const path3x = path.join(targetDir, icon.dest.replace('.png', '@3x.png'));
    
    try {
      await download(icon.url, mainPath);
      // Copy to 2x and 3x sizes for high density displays
      fs.copyFileSync(mainPath, path2x);
      fs.copyFileSync(mainPath, path3x);
    } catch (err) {
      console.error(`Failed to download ${icon.dest}:`, err);
    }
  }
  console.log('Tải biểu tượng hoàn tất thành công!');
}

main();
