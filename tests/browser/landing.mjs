// Start a local HTTP server and Chrome with --remote-debugging-port=9333.
// For Android Chrome, forward its devtools socket and set CDP_PORT=9222.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

const port=process.env.CDP_PORT || '9333';
const origin=process.env.CALCULATOR_TEST_URL || 'http://localhost:5000/';
const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const localTabs=tabs.filter(t=>t.type==='page' && t.url.startsWith(origin));
const tab=localTabs.find(t=>t.url===new URL('landing.html',origin).href) || localTabs[0];
assert.ok(tab,'Open the local landing page in the test browser.');
const socket=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let id=0;
const pending=new Map(),errors=[];
socket.onmessage=({data})=>{
    const message=JSON.parse(data);
    if(message.id) {
        const request=pending.get(message.id);
        if(request) {pending.delete(message.id);message.error?request.reject(Error(message.error.message)):request.resolve(message.result);}
    } else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);
};
const call=(method,params={})=>new Promise((resolve,reject)=>{
    const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));
    setTimeout(()=>{if(pending.delete(n))reject(Error('Timeout: '+method));},20000).unref();
});
async function evaluate(expression) {
    const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));
    return r.result.value;
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(selector) {
    const deadline=Date.now()+20000;
    while(!await evaluate(`document.readyState==='complete' && !!document.querySelector(${JSON.stringify(selector)})`)) {
        if(Date.now()>deadline)throw Error('Page did not load: '+selector);
        await pause(100);
    }
    await pause(120);
}
async function navigate(page) {await call('Page.navigate',{url:new URL(page,origin).href});await ready(page==='landing.html'?'#hero-title':'#math-expression:not([hidden])');}
async function click(selector,touch) {
    const point=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    if(touch) {
        await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,radiusX:2,radiusY:2}]});
        await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    } else {
        await call('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
        await call('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
    }
}
async function screenshot(name,fullPage=false) {
    const params={format:'png',captureBeyondViewport:fullPage};
    if(fullPage) {
        const {cssContentSize}=await call('Page.getLayoutMetrics');
        params.clip={x:0,y:0,width:cssContentSize.width,height:cssContentSize.height,scale:1};
    }
    const {data}=await call('Page.captureScreenshot',params);
    await writeFile(`/tmp/physics-landing-${name}.png`,Buffer.from(data,'base64'));
}
async function checkLayout(name,height) {
    const geometry=await evaluate(`({width:innerWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('h1,h2,h3,p,.button,.calculator-preview,.site-header')].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.className||e.tagName),brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,cta:document.querySelector('.hero-actions .button').getBoundingClientRect().toJSON()})`);
    assert.ok(geometry.scroll<=geometry.width+1,`${name}: horizontal page overflow ${JSON.stringify(geometry)}`);
    assert.deepEqual(geometry.overflow,[],`${name}: clipped content`);
    assert.equal(geometry.brokenImages,0);
    assert.ok(geometry.cta.bottom<=height,`${name}: hero CTA should be visible without scrolling`);
}
async function language(value) {
    await evaluate(`(()=>{const control=document.getElementById('landing-language');control.value=${JSON.stringify(value)};control.dispatchEvent(new Event('change',{bubbles:true}));})()`);
    assert.equal(await evaluate('document.documentElement.lang'),value);
}

await call('Page.bringToFront');
await call('Runtime.enable');await call('Page.enable');await call('Network.enable');
await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
const android=port==='9222';
const sizes=android?[['android',360,740,true]]:[['laptop',1440,900,false],['tablet',820,1180,true],['tablet-landscape',1180,820,true],['phone',360,740,true],['phone-small',320,640,true]];
await navigate('landing.html');
const originalLanguage=await evaluate("localStorage.getItem('physics-calculator-landing-language-v1')");
await evaluate("localStorage.removeItem('physics-calculator-landing-language-v1')");
try {
    for(const [name,width,height,touch] of sizes) {
        await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:touch});
        await call('Emulation.setTouchEmulationEnabled',{enabled:touch});
        await navigate('landing.html');
        assert.equal(await evaluate('document.documentElement.lang'),'en','Default language is English');
        assert.equal(await evaluate('document.getElementById("language-control").hidden'),false);
        assert.match(await evaluate('document.title'),/More physics/);
        assert.match(await evaluate('document.querySelector(".preview-answer strong").textContent'),/2\.33053/);
        await checkLayout(name+' English',height);await screenshot(name+'-en',true);
        await language('de');
        assert.match(await evaluate('document.title'),/Mehr Physik/);
        assert.match(await evaluate('document.querySelector("meta[name=description]").content'),/Dein Taschenrechner/);
        assert.equal(await evaluate('document.querySelector(".site-header nav").getAttribute("aria-label")'),'Hauptnavigation');
        assert.match(await evaluate('document.querySelector(".preview-answer strong").textContent'),/2,33053/);
        await checkLayout(name+' German',height);await screenshot(name+'-de',true);
        await call('Page.reload');await ready('#hero-title');
        assert.equal(await evaluate('document.documentElement.lang'),'de','Explicit language survives reload');
        await language('en');
        assert.match(await evaluate('document.querySelector("meta[name=description]").content'),/Your physics calculator/);
        for(const selector of ['.site-header .button','.hero-actions .button','.final-cta .button','.site-footer nav a:last-child']) {
            await click(selector,touch);await ready('#math-expression:not([hidden])');
            assert.equal(await evaluate('location.pathname.endsWith("/index.html")'),true,name+' CTA opens calculator');
            await navigate('landing.html');
        }
        await click('.hero-actions .text-link',touch);
        assert.equal(await evaluate('location.hash'),'#so-gehts');
        await click('.workflow-copy .text-link',touch);await ready('h1');
        assert.equal(await evaluate('location.pathname.endsWith("/guide.html")'),true);
        console.log(`PASS ${name}: English/German layout, language persistence, images, calculator links and guide`);
    }
    await navigate('landing.html');
    await evaluate("localStorage.setItem('physics-calculator-landing-language-v1','invalid')");
    await call('Page.reload');await ready('#hero-title');
    assert.equal(await evaluate('document.documentElement.lang'),'en','Unknown preference falls back to English');
    await language('de');
    await evaluate(`(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));})()`);
    await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
    await call('Page.reload');await ready('#hero-title');
    assert.equal(await evaluate('document.documentElement.lang'),'de','Offline language preference is retained');
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.hero')).display"),'grid');
    await language('en');
    await click('.hero-actions .button',true);await ready('#math-expression:not([hidden])');
    assert.equal(await evaluate("PhysicsEngine.evaluate('2+2').value"),4);
    console.log('PASS cached landing page, language switching and calculator navigation work offline');
    assert.deepEqual(errors,[],'No JavaScript exceptions');
} finally {
    await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    await call('Emulation.clearDeviceMetricsOverride');
    await call('Emulation.setTouchEmulationEnabled',{enabled:false});
    await call('Emulation.setEmulatedMedia',{features:[]});
    await evaluate(`(()=>{const value=${JSON.stringify(originalLanguage)};if(value===null)localStorage.removeItem('physics-calculator-landing-language-v1');else localStorage.setItem('physics-calculator-landing-language-v1',value);})()`);
    await navigate('landing.html');
    socket.close();
}
