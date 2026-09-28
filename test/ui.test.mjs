import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {readFileSync} from 'node:fs';
import {renderMarkdown,renderDiff,markdownBlocks,diffFiles,diffStats} from '../public/ui.js';
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
test('file review shows every hunk line, including content that looks like a patch header',()=>{
 const {document}=parseHTML('<html><body></body></html>');globalThis.document=document;
 try{
  const patch=['diff --git a/q.sql b/q.sql','index 1111111..2222222 100644','--- a/q.sql','+++ b/q.sql','@@ -1,3 +1,3 @@',' SELECT 1;','--- drop the audit trigger','+++ new header marker','+index looks like metadata',' SELECT 2;','\\ No newline at end of file'].join('\n');
  const view=renderDiff(patch),text=view.textContent;
  for(const line of ['--- drop the audit trigger','+++ new header marker','+index looks like metadata','\\ No newline at end of file'])assert.ok(text.includes(line),line);
  assert.equal(view.querySelectorAll('.deletion').length,1);assert.equal(view.querySelectorAll('.addition').length,2);
  assert.equal(view.querySelector('.file-name').textContent,'q.sql');assert.equal(view.querySelector('.file-counts').textContent,'+2 −1');
  assert.equal(text.includes('index 1111111'),false);
 }finally{delete globalThis.document;}
});
test('patch metadata becomes file status, names come from headers and counts exclude headers',()=>{
 const patch=['diff --git a/new file.txt b/new file.txt','new file mode 100644','index 0000000..e69de29','--- /dev/null','+++ b/new file.txt','@@ -0,0 +1 @@','+hello',
  'diff --git a/gone.txt b/gone.txt','deleted file mode 100644','--- a/gone.txt','+++ /dev/null','@@ -1 +0,0 @@','-bye',
  'diff --git a/old.js b/new.js','similarity index 90%','rename from old.js','rename to new.js','--- a/old.js','+++ b/new.js','@@ -1 +1 @@','-a','+b',
  'diff --git a/logo.png b/logo.png','Binary files a/logo.png and b/logo.png differ',''].join('\n');
 const files=diffFiles(patch);
 assert.deepEqual(files.map(f=>[f.name,f.status,f.additions,f.deletions,f.binary]),[['new file.txt','added',1,0,false],['gone.txt','deleted',0,1,false],['new.js','renamed',1,1,false],['logo.png','modified',0,0,true]]);
 assert.equal(files[2].from,'old.js');
 assert.deepEqual(diffStats(patch),{files:4,additions:2,deletions:2});
});
