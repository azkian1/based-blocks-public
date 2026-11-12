import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
  encoding: 'utf8'
}).split('\0').filter(Boolean);
const problems = [];
const trackedPaths = new Set(files);
for (const match of readFileSync('README.md', 'utf8').matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
  if (!trackedPaths.has(match[1])) problems.push(`README.md: image path must match a tracked file, including letter case`);
}
const forbidden = /(?:^|\/)(?:node_modules|dist|\.claude|\.codex|\.agents|\.vercel|\.playwright-mcp|broadcast|cache|out)(?:\/|$)|(?:^|\/)(?:downloads|candidates)\/|\.(?:pem|key|p12|pfx|keystore|jks|bundle|log|dump|sqlite3?)$/i;
const textExtensions = new Set(['.js', '.mjs', '.cjs', '.json', '.html', '.css', '.md', '.txt', '.svg', '.sol', '.toml', '.yml', '.yaml', '.bat', '.cmd']);
const checks = [
  ['personal email', /[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9.-]{1,253}\.[A-Za-z]{2,24}/g],
  ['local user path', /(?:[A-Za-z]:[\\/]+(?:Users|Projects0)[\\/]+|\/(?:Users|home)\/[^/\s]+\/)/g],
  ['server secret exposed as browser configuration', /\bVITE_[A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|PRIVATE_KEY)[A-Z0-9_]*\b/g]
];

for (const file of new Set(files)) {
  const base = path.posix.basename(file);
  if (forbidden.test(file) || (base.startsWith('.env') && base !== '.env.example')) {
    problems.push(`${file}: private or generated file`);
    continue;
  }
  if (!textExtensions.has(path.extname(file)) && base !== '.env.example') continue;
  const text = readFileSync(file, 'utf8');
  for (const [label, pattern] of checks) {
    for (const match of text.matchAll(pattern)) {
      if (label === 'personal email' && match[0].endsWith('@users.noreply.github.com')) continue;
      const line = text.slice(0, match.index).split('\n').length;
      problems.push(`${file}:${line}: ${label}`);
    }
  }
  if (base === '.env.example') {
    for (const line of text.split(/\r?\n/)) {
      const setting = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (setting && /TOKEN|SECRET|PASSWORD|PRIVATE_KEY/.test(setting[1]) && setting[2] !== '') {
        problems.push(`${file}: secret examples must be empty`);
      }
    }
  }
}

const history = execFileSync('git', ['log', '--all', '--format=%ae%n%ce%n%B'], {
  encoding: 'utf8'
});
for (const [label, pattern] of checks.slice(0, 2)) {
  for (const match of history.matchAll(pattern)) {
    if (label === 'personal email' && match[0].endsWith('@users.noreply.github.com')) continue;
    problems.push(`Git history: ${label}`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Publication checks passed for ${new Set(files).size} files. Values are never printed.`);
}
