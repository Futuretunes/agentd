import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {readFileSync} from 'node:fs';
import {renderMarkdown,renderDiff,markdownBlocks} from '../public/ui.js';
test('untrusted answers render as inert text with bounded Markdown and no remote resources',()=>{
 const {document}=parseHTML('<html><body></body></html>');globalThis.document=document;
 try {
  const input='# Answer\n\n**Important** `code`\n\n<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n[click](javascript:alert(1))\n![remote](https://example.com/tracker)\n\n```html\n<iframe src="https://example.com"></iframe>\n```';
  const answer=renderMarkdown(input);assert.equal(answer.querySelector('h2').textContent,'Answer');assert.equal(answer.querySelector('strong').textContent,'Important');
  assert.equal(answer.querySelectorAll('script,img,iframe,a,[onerror]').length,0);assert.match(answer.textContent,/<script>alert/);assert.equal(answer.querySelector('.code-block code').textContent,'<iframe src="https://example.com"></iframe>');
  assert.ok(markdownBlocks('a'.repeat(300000))[0].text.length<=200000);
  assert.equal(renderMarkdown('```js\nunclosed').querySelector('code').textContent,'unclosed');
 }finally{delete globalThis.document;}
});
test('file review retains exact hostile lines as text and separates files with line numbers',()=>{
 const {document}=parseHTML('<html><body></body></html>');globalThis.document=document;
 try{const patch='diff --git a/a b/a\n--- a/a\n+++ b/a\n@@ -1 +1 @@\n-<img src=x>\n+<script>x</script>\ndiff --git a/b b/b\n@@ -0,0 +1 @@\n+hello';const view=renderDiff(patch);assert.equal(view.querySelectorAll('details').length,2);assert.equal(view.querySelectorAll('script,img').length,0);assert.match(view.querySelector('.addition').textContent,/<script>x<\/script>/);assert.ok(view.querySelector('.line-number'));}finally{delete globalThis.document;}
});
test('workspace has unique controls, keyboard-accessible attachment input and named navigation',()=>{
 const {document}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));const ids=[...document.querySelectorAll('[id]')].map(n=>n.id);assert.equal(ids.length,new Set(ids).size);
 for(const id of ['mode','adapter','drawer-open','preferences-menu','run-options','project-menu'])assert.ok(document.getElementById(id),id);
 assert.equal(document.getElementById('files').hasAttribute('hidden'),false);assert.equal(document.getElementById('drawer-open').getAttribute('aria-controls'),'sidebar');
 assert.match(document.getElementById('project-form').textContent,/only after supported npm checks pass/);
});
