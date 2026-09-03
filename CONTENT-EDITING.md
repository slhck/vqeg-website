# Editing VQEG website content

## Page content

Public pages and project pages are ordinary MDX files in `src/data/page/`. Each file begins with a small metadata block followed by the page text. Editors can safely change the title and body in Decap CMS or any Markdown editor.

Use headings, paragraphs, normal links, and bulleted lists for routine edits. Keep the `source` line unchanged: it records the corresponding page in the archived website for reference only.

## Archive lists

On the Meetings and Publications & Software pages, every level-3 heading followed by a bulleted list becomes a collapsed archive section automatically. To add or change an archive, edit its heading and the bulleted file links as normal MDX; do not add HTML accordion markup. Meeting archive headings use `YYYY_MM` prefixes and are displayed newest first automatically.

## Images and downloads

Public images and legacy downloads are in `public/media/`. Refer to an image from page content as `/media/folder/filename.jpg`.

Meeting files are intentionally not part of this repository. When the external meeting-file storage is available, link to it from the relevant meeting page instead of adding multi-gigabyte archives here.

## New pages

Create a new MDX file in `src/data/page/`. Its directory and filename define the URL: `src/data/page/projects/example.mdx` becomes `/projects/example`.

Use this minimal starting point:

```mdx
---
title: 'Example page'
---

## First section

Write the page here.
```
