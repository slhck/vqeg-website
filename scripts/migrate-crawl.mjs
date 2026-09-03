#!/usr/bin/env node

/**
 * One-off importer for the archived VQEG site.
 *
 * It deliberately imports only public HTML pages. Meeting files and other
 * downloads remain outside this repository; links to the files are retained.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const crawl = resolve(root, '../vqeg-org-crawl/crawl');
const destination = join(root, 'src/data/page');

const ignored = new Set(['index.html', 'vqeg-home/index.html', 'projects-home/index.html']);
const aliases = new Map([
  ['vqeg-home/index.html', ''],
  ['projects-home/index.html', 'projects'],
  ['vqeg/publications-software-and-datasets.aspx.html', 'publications-and-software'],
  ['publications-and-software/publications/index.html', 'publications-and-software'],
  ['meetings-home/index.html', 'meetings'],
  ['meetings-home/vqeg-meeting-virtual/index.html', 'meetings/virtual'],
]);

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

function routeFor(file) {
  const sourcePath = relative(crawl, file).replaceAll('\\', '/');
  if (aliases.has(sourcePath)) return aliases.get(sourcePath);
  return sourcePath
    .replace(/\/index\.html$/, '')
    .replace(/\.aspx\.html$/, '')
    .replace(/\.html$/, '');
}

function localUrl(url, sourceFile) {
  if (!url || url.startsWith('#') || /^(?:https?:|mailto:|tel:|data:)/i.test(url)) return url;
  const [pathname, suffix = ''] = url.split(/(?=[?#])/);
  if (pathname.startsWith('/')) return `${pathname}${suffix}`;
  if (pathname.startsWith('../media/') || pathname.startsWith('../../media/') || pathname.startsWith('media/')) {
    return `/${pathname.replace(/^(?:\.\.\/)+/, '')}${suffix}`;
  }
  if (pathname.startsWith('../assets/') || pathname.startsWith('../../assets/') || pathname.startsWith('assets/')) {
    return `/${pathname.replace(/^(?:\.\.\/)+/, '')}${suffix}`;
  }
  const target = normalize(resolve(dirname(sourceFile), pathname));
  if (!target.startsWith(crawl)) return url;
  const route = routeFor(target);
  return route ? `/${route}${suffix}`.replace(/\/$/, '/') : `/${suffix}`;
}

function titleFrom(html, fallback) {
  const match =
    html.match(/<title>\s*([^<]+?)\s*-\s*VQEG\s*<\/title>/i) || html.match(/<h1[^>]*>\s*([\s\S]*?)\s*<\/h1>/i);
  return (match?.[1] ?? fallback)
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function frontmatterValue(value) {
  return JSON.stringify(value);
}

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });

const pages = walk(crawl)
  .filter((file) => /(?:index|[^/]+\.aspx)\.html$/.test(file))
  .filter((file) => !ignored.has(relative(crawl, file).replaceAll('\\', '/')))
  .filter(
    (file) =>
      ![
        'vqeg/publications-software-and-datasets.aspx.html',
        'publications-and-software/publications/index.html',
      ].includes(relative(crawl, file).replaceAll('\\', '/'))
  );

for (const file of pages) {
  const source = readFileSync(file, 'utf8');
  const main =
    source.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
    source.match(/<div id="content"[^>]*>([\s\S]*?)<\/div>\s*<div id="navBar"/i)?.[1];
  if (!main) throw new Error(`No main element found in ${file}`);

  const rewritten = main.replace(/\b(href|src)="([^"]+)"/gi, (_match, attribute, url) => {
    return `${attribute}="${localUrl(url, file)}"`;
  });
  let markdown = execFileSync('pandoc', ['-f', 'html', '-t', 'gfm', '--wrap=none'], {
    input: rewritten,
    encoding: 'utf8',
  });
  markdown = markdown
    .replace(/^<\/?div[^>]*>\s*$/gm, '')
    .replace(/^<\/?figure[^>]*>\s*$/gm, '')
    .replace(/<((?:https?:\/\/)[^>\s]+)>/g, '[$1]($1)')
    .replace(/<([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})>/g, '[$1](mailto:$1)')
    .replace(/<\/?span\b[^>]*>/gi, '')
    .replace(/<!--(?:[\s\S]*?)-->/g, '')
    .replace(/^# .+\n+/m, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .trim();

  const route = routeFor(file);
  const target = join(destination, `${route || 'index'}.mdx`);
  mkdirSync(dirname(target), { recursive: true });
  const title = titleFrom(source, route || 'VQEG');
  writeFileSync(
    target,
    `---\ntitle: ${frontmatterValue(title)}\nsource: ${frontmatterValue(relative(crawl, file))}\n---\n\n${markdown}\n`
  );
}

console.log(`Imported ${pages.length} archived pages into ${relative(root, destination)}.`);
