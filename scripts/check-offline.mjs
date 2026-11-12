import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const problems = [];
const networkPatterns = [
  /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|RTCPeerConnection)\s*\(/,
  /\b(?:sendBeacon|openExternal|window\.open|navigator\.share)\s*\(/,
  /(?:https?|wss?):\/\//,
  /\b(?:eth_requestAccounts|wallet_switchEthereumChain|wallet_addEthereumChain)\b/,
  /\b(?:import\.meta\.env|process\.env)\b/
];
for (const file of new Set(files)) {
  if (/^(?:api|contracts|src\/services|public\/\.well-known)\//.test(file)) problems.push(`${file}: external integration file`);
  const runtimeCode = /^(?:src\/.*\.js|index\.html|public\/.*\.css)$/.test(file);
  const vectorAsset = /^public\/.*\.svg$/.test(file);
  if (!runtimeCode && !vectorAsset) continue;
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  if (runtimeCode) for (const pattern of networkPatterns) if (pattern.test(text)) problems.push(`${file}: external connection capability`);
  if (vectorAsset && /(?:href|src)\s*=\s*["'](?:https?:)?\/\//i.test(text)) problems.push(`${file}: external asset reference`);
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (JSON.stringify(pkg.dependencies) !== JSON.stringify({ phaser: '3.90.0' })) problems.push('Only the pinned game engine may be a runtime dependency');
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
for (const name of Object.keys(lock.packages || {})) {
  if (/(?:^|\/)(?:@farcaster|@walletconnect|@coinbase|@vercel|wagmi|viem|ethers|redis|supabase|firebase)(?:\/|$)/i.test(name)) problems.push(`${name}: external service dependency`);
}
const html = readFileSync('index.html', 'utf8');
if (!html.includes("connect-src 'self'") || !html.includes("form-action 'none'")) problems.push('The browser connection policy must remain enabled');
if (problems.length) {
  console.error([...new Set(problems)].join('\n'));
  process.exitCode = 1;
} else console.log('Offline checks passed: local assets and browser storage only.');
