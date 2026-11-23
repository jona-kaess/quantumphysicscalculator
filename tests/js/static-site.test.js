const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

test('all pages and local assets use relative paths suitable for GitHub Pages',()=>{
    for(const page of ['index.html']) {
        const html=fs.readFileSync(page,'utf8');
        assert.match(html,/<!doctype html>/i);
        assert.ok(!html.includes('{{') && !html.includes('{%'),`${page} contains template syntax`);
        for(const [,url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
            if (/^(https?:|#)/.test(url)) continue;
            assert.ok(!url.startsWith('/'),`${page}: ${url} must be relative`);
            const [asset,query]=url.split('?');
            assert.ok(fs.existsSync(path.resolve(path.dirname(page),asset)),`${page}: missing ${url}`);
            if(asset.startsWith('assets/')) {
                const digest=crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex').slice(0,12);
                assert.equal(query,`v=${digest}`,`${page}: run python3 scripts/version_assets.py after changing ${asset}`);
            }
        }
    }
});
test('PWA manifest and offline shell use deployable relative resources',()=>{
    const manifest=JSON.parse(fs.readFileSync('manifest.webmanifest','utf8'));
    assert.equal(manifest.display,'standalone');
    assert.ok(!manifest.start_url.startsWith('/'));
    for(const icon of manifest.icons) assert.ok(fs.existsSync(icon.src));
    const worker=fs.readFileSync('service-worker.js','utf8');
    for(const asset of ['index.html','assets/js/physics-engine.js','assets/js/calculator.js']) assert.ok(worker.includes(asset),asset);
    assert.match(worker,/ignoreSearch:true/);
});
