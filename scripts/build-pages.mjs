import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });

const deploymentAssets = 'pages-assets';
mkdirSync(deploymentAssets, { recursive: true });
const html = readFileSync('dist/index.html', 'utf8')
  .replaceAll('"/assets/', '"/pages-assets/')
  .replace('<div id="root"></div>', '<div id="root" data-static-preview></div>');
writeFileSync('index.html', html);

for (const name of readdirSync('dist/assets', { withFileTypes: true })) {
  if (!name.isFile()) continue;
  const contents = readFileSync('dist/assets/' + name.name, 'utf8')
    .replaceAll('/assets/aistudio/', '/public/assets/aistudio/');
  writeFileSync(deploymentAssets + '/' + name.name, contents);
}
writeFileSync('.nojekyll', '');
