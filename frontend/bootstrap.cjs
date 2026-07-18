/**
 * Bootstrap: downloads npm tarball and runs npm install using only Node.js builtins.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

const NPM_VERSION = '10.8.0';
const NPM_URL = `https://registry.npmjs.org/npm/-/npm-${NPM_VERSION}.tgz`;
const NPM_DIR = path.join(__dirname, '.npm-bootstrap');
const tgzPath = path.join(NPM_DIR, 'npm.tgz');

function download(url, dest, redirects) {
  redirects = redirects || 0;
  if (redirects > 5) { console.error('Too many redirects'); process.exit(1); }
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, dest, redirects + 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}

async function extractTarGz(tgzPath, destDir) {
  return new Promise((resolve, reject) => {
    const gunzip = zlib.createGunzip();
    const input = fs.createReadStream(tgzPath);
    
    // Manual tar extraction
    let buffer = Buffer.alloc(0);
    const chunks = [];
    
    input.pipe(gunzip);
    gunzip.on('data', (chunk) => chunks.push(chunk));
    gunzip.on('end', () => {
      buffer = Buffer.concat(chunks);
      let offset = 0;
      
      while (offset < buffer.length - 512) {
        const header = buffer.slice(offset, offset + 512);
        if (header.every(b => b === 0)) break;
        
        // Parse tar header
        const name = header.slice(0, 100).toString('utf8').replace(/\0/g, '');
        const sizeStr = header.slice(124, 135).toString('utf8').replace(/\0/g, '').trim();
        const size = parseInt(sizeStr, 8) || 0;
        const type = String.fromCharCode(header[156]);
        
        offset += 512;
        
        if (type === '0' || type === '' || type === '\0') {
          // Regular file
          const filePath = path.join(destDir, name.replace(/^package\//, 'package/'));
          const dirPath = path.dirname(filePath);
          if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
          fs.writeFileSync(filePath, buffer.slice(offset, offset + size));
        }
        
        // Round up to 512-byte boundary
        offset += Math.ceil(size / 512) * 512;
      }
      
      resolve();
    });
    gunzip.on('error', reject);
    input.on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(NPM_DIR, { recursive: true });
  
  console.log('Downloading npm', NPM_VERSION, '...');
  await download(NPM_URL, tgzPath);
  console.log('Download complete. Extracting...');
  
  await extractTarGz(tgzPath, NPM_DIR);
  console.log('Extraction complete.');
  
  const npmCliPath = path.join(NPM_DIR, 'package', 'bin', 'npm-cli.js');
  
  if (!fs.existsSync(npmCliPath)) {
    console.error('npm-cli.js not found at:', npmCliPath);
    console.log('Contents of NPM_DIR:', fs.readdirSync(NPM_DIR));
    process.exit(1);
  }
  
  console.log('Running npm install...');
  const result = spawnSync(process.execPath, [npmCliPath, 'install'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env,
  });
  
  if (result.status !== 0) {
    console.error('npm install failed with code:', result.status);
    process.exit(1);
  }
  
  console.log('\n✅ Done! Frontend dependencies installed.');
  console.log('To run dev server: node .npm-bootstrap/package/bin/npm-cli.js run dev');
  console.log('To run tests: node .npm-bootstrap/package/bin/npm-cli.js test');
}

main().catch((err) => {
  console.error('Bootstrap error:', err.message);
  process.exit(1);
});
