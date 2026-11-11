#!/usr/bin/env node
// Gọn hơn linear-put.mjs: chỉ cần uploadRequest.url (headers tự dựng lại giống prepare_file_upload).
// node linear-put-url.mjs <file> "<caption>" <uploadUrl> <uploadFilename>
// In ra markdown ảnh (![caption](asset)) hoặc link video ([🎬 Video: caption](asset)).
import { readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';

const [file, caption, putUrl, uploadName] = process.argv.slice(2);
if (!file || !caption || !putUrl || !uploadName) {
  console.error('usage: linear-put-url.mjs <file> "<caption>" <uploadUrl> <uploadFilename>');
  process.exit(2);
}
const ext = extname(file).toLowerCase();
const type = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4' }[ext] ?? 'application/octet-stream';
const size = statSync(file).size;
const res = await fetch(putUrl, {
  method: 'PUT',
  headers: {
    'content-type': type,
    'cache-control': 'public, max-age=31536000',
    'x-goog-content-length-range': `${size},${size}`,
    'Content-Disposition': `attachment; filename="${uploadName}"`,
  },
  body: readFileSync(file),
});
if (!res.ok) {
  console.error(`PUT failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
const asset = putUrl.split('?')[0].replace('https://storage.googleapis.com/uploads.linear.app/', 'https://uploads.linear.app/');
console.log(type.startsWith('image/') ? `![${caption}](${asset})` : `[🎬 Video: ${caption}](${asset})`);
