#!/usr/bin/env node
// 扫描 reports/YYYY/MM/*.html 生成 reports.json
// 用法: node scripts/build-index.mjs

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS_DIR = join(ROOT, 'reports');
const OUTPUT = join(ROOT, 'reports.json');

const DATE_RE = /(\d{4})-(\d{2})-(\d{2})/;
const DATE_COMPACT_RE = /(\d{4})(\d{2})(\d{2})/;
const TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title>/i;
const H1_RE = /<h1[^>]*>([\s\S]*?)<\/h1>/i;

async function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) out = out.concat(await walk(p));
    else if (ent.isFile() && ent.name.toLowerCase().endsWith('.html')) out.push(p);
  }
  return out;
}

function stripTags(s) {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}

async function extractTitle(file) {
  try {
    const html = await readFile(file, 'utf8');
    const m = html.match(TITLE_RE) || html.match(H1_RE);
    if (m) {
      const t = decodeEntities(stripTags(m[1]));
      if (t) return t;
    }
  } catch { /* ignore */ }
  return null;
}

function extractDate(path) {
  const base = path.split(sep).pop().replace(/\.html?$/i, '');
  const m1 = base.match(DATE_RE);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
  const m2 = base.match(DATE_COMPACT_RE);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return null;
}

async function main() {
  const files = await walk(REPORTS_DIR);
  const reports = [];
  const skipped = [];
  for (const f of files) {
    const date = extractDate(f);
    if (!date) { skipped.push(f); continue; }
    const title = (await extractTitle(f)) || `${date} 每日复盘`;
    const rel = relative(ROOT, f).split(sep).join('/');
    reports.push({ date, title, path: rel });
  }
  reports.sort((a, b) => b.date.localeCompare(a.date) || a.path.localeCompare(b.path));
  const json = JSON.stringify({ reports }, null, 2) + '\n';
  await writeFile(OUTPUT, json, 'utf8');
  console.log(`[build-index] ${reports.length} 条复盘 → reports.json`);
  if (skipped.length) {
    console.warn(`[build-index] 跳过 ${skipped.length} 个未能解析日期的文件:`);
    for (const s of skipped) console.warn('  - ' + relative(ROOT, s));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
