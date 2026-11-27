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

test('editable math and its fonts are bundled in the offline shell',()=>{
    const worker=fs.readFileSync('service-worker.js','utf8');
    for(const asset of ['assets/js/math-editor.js','assets/vendor/mathlive/mathlive.min.js','assets/vendor/mathlive/mathlive-fonts.css',...fs.readdirSync('assets/vendor/mathlive/fonts').map(name=>'assets/vendor/mathlive/fonts/'+name)]) {
        assert.ok(fs.existsSync(asset),asset);
        assert.ok(worker.includes(asset),`${asset} must be available offline`);
    }
    assert.ok(fs.existsSync('assets/vendor/mathlive/LICENSE.txt'));
});

test('preferences and shared launcher artwork are present in the app and offline cache',()=>{
    const html=fs.readFileSync('index.html','utf8'),worker=fs.readFileSync('service-worker.js','utf8');
    assert.match(html,/id="settings-button"/);assert.match(html,/id="settings-dialog"/);
    assert.ok(!html.includes('id="suggestion-hint"'));assert.ok(!html.includes('class="mobile-keys"'));
    for(const path of ['assets/js/settings.js','assets/logo.svg','assets/icon-maskable-512.png'])assert.ok(worker.includes(path));
    for(const size of [192,512]) {
        const png=fs.readFileSync(`assets/icon-${size}.png`);
        assert.equal(png.readUInt32BE(16),size);assert.equal(png.readUInt32BE(20),size);
    }
    const android=fs.readFileSync('android/app/src/main/AndroidManifest.xml','utf8');
    assert.match(android,/@mipmap\/ic_launcher/);
    assert.ok(fs.existsSync('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'));
});
