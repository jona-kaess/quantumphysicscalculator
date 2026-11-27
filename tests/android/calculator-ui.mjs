// Run with Node 22+ after adb forward tcp:9222 localabstract:chrome_devtools_remote
// and adb reverse tcp:5000 tcp:5000, with the local site running on port 5000.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const adb=process.env.ADB || 'adb';
const origin=process.env.CALCULATOR_TEST_URL || 'http://localhost:5000/';
const tabs=await (await fetch('http://127.0.0.1:9222/json/list')).json();
const tab=tabs.filter(tab=>tab.type==='page' && tab.url.startsWith(origin)).sort((a,b)=>Number(b.id)-Number(a.id))[0];
assert.ok(tab,'Open the local calculator in Android Chrome first.');
const socket=new WebSocket(tab.webSocketDebuggerUrl), pending=new Map(), errors=[];
let sequence=0;
await new Promise((resolve,reject)=>{socket.onopen=resolve; socket.onerror=reject;});
socket.onmessage=({data})=>{const message=JSON.parse(data); if(message.id){const item=pending.get(message.id);if(!item)return;pending.delete(message.id);message.error?item.reject(Error(message.error.message)):item.resolve(message.result);}else if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);};
const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(Error('Timed out: '+method));}},15000).unref();});
const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function tap(selector) {
    const deadline=Date.now()+4000;
    while(!await visible(selector)) {if(Date.now()>=deadline){await screenshot('calculator-redesign-failure.png');console.log(await evaluate(`JSON.stringify({selector:${JSON.stringify(selector)},viewport:{h:visualViewport.height,top:visualViewport.offsetTop,scale:visualViewport.scale},rect:document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect().toJSON(),focused:document.activeElement.id,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),classes:document.body.className})`));throw Error('Touch target must be visible: '+selector);}await pause(100);}
    const position=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}); if(!e || e.hidden) throw Error('Missing target'); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[position]});
    await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await pause(180);
}
async function type(expression) {
    await evaluate(`(()=>{const e=document.getElementById('expression');e.value=${JSON.stringify(expression)};e.dispatchEvent(new Event('input',{bubbles:true}));})()`);
    await tap(await evaluate("document.getElementById('math-expression')?.hidden===false?'#math-expression':'#expression'"));
    await pause(250);
}
const value=()=>evaluate("document.getElementById('expression').value");
const result=()=>evaluate("document.getElementById('mobile-result-value').textContent.replace(/\\s/g,'')");
async function visible(selector) {
    return evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect(),v=visualViewport;const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return (hit===e || e.contains(hit)) && !e.hidden && r.width>0 && r.height>0 && r.top>=v.offsetTop-1 && r.bottom<=v.offsetTop+v.height-(window.PhysicsMath?.keyboardHeight() || 0)+1 && r.right<=v.width+1;})()`);
}
async function screenshot(name) {await writeFile(join('/tmp',name),execFileSync(adb,['exec-out','screencap','-p']));}
await call('Runtime.enable');
await call('Page.enable');
await fetch('http://127.0.0.1:9222/json/activate/'+tab.id);
await call('Page.navigate',{url:origin+'?ui-test='+Date.now()});
await pause(1200);
await call('Page.reload',{ignoreCache:true});
await pause(1000);
console.log(await evaluate("JSON.stringify({url:location.href,title:document.title,state:document.readyState})"));
const saved=await evaluate("localStorage.getItem('physics-calculator-saved-v1')");
try {
    if(!process.env.VIEWPORT_ONLY) {
    await pause(500);
    await screenshot('calculator-redesign-idle.png');
    await type('hba');
    await screenshot('calculator-math-start.png');
    assert.ok(await evaluate("document.body.classList.contains('keyboard-open')"),'Math keyboard must be open.');
    assert.ok(await visible('#completion-0'),'Constant suggestion must be above keyboard.');
    assert.ok(await visible('.mobile-keys'),'Editing keys must be above keyboard.');
    await tap('#completion-0');
    assert.equal(await value(),'hbar');
    assert.ok(await visible('#mobile-result'),'Result must be above keyboard.');
    assert.match(await result(),/1\.05457182/);
    await screenshot('calculator-redesign-keyboard.png');
    console.log('PASS constant suggestions, selection and keyboard layout');
    await type('sin');
    await tap('#completion-0');
    assert.equal(await value(),'sin()');
    await call('Input.insertText',{text:'0'});await pause(250);
    assert.equal(await value(),'sin(0)');assert.equal(await result(),'0');
    console.log('PASS function completion and cursor between parentheses');
    await type('');await tap('[data-insert="/"]');
    await call('Input.insertText',{text:'1'});await pause(100);
    await tap('[data-command="moveToNextPlaceholder"]');
    await call('Input.insertText',{text:'2'});await pause(200);
    await screenshot('calculator-fraction-editing.png');
    assert.match(await result(),/0\.5/);
    assert.match(await evaluate("document.getElementById('math-expression').value"),/\\frac/);
    await screenshot('calculator-fraction-editing.png');
    console.log('PASS fraction key, numerator, denominator and field navigation');
    await type('');
    for(const char of 'hbar') {await call('Input.insertText',{text:char});await pause(60);}
    assert.equal(await value(),'hbar');
    assert.ok(await evaluate("document.getElementById('math-expression').shadowRoot.textContent.includes('ℏ')"),'hbar rendered as a symbol in the editor');
    console.log('PASS typed constant becomes its mathematical symbol');
    for(const constant of ['k_B','mu_B']) {
        await type('');for(const char of constant) {await call('Input.insertText',{text:char});await pause(60);}
        assert.equal(await value(),constant,'typed subscript constant '+constant);
    }
    console.log('PASS typed subscript constants');

    for(const [expression,pattern] of [
        ['sqrt(16)+2^3',/12/],['sin(30 deg)',/0\.5/],['300 K eq eV',/25\.8519998meV/],
        ['(2+3i)*2',/4.*6i/],['20 degC - 10 degC',/10K/],['1 erg eq J',/10/],
        ['2 kg * 9.81 m / s^2',/19\.62N/],['mod(11,3)',/2/],['2**3**2',/512/],
        ['1 eV eq GHz',/equiv/],['1 GHz',/1GHz/],['frac(1,frac(2,3))',/1\.5/]
    ]) {await type(expression);assert.match(await result(),pattern,expression);assert.ok(await visible('#mobile-result'),expression+' visible');console.log('PASS '+expression);}
    await type('1 m + 1 s');
    assert.match(await evaluate("document.getElementById('calculator-error').textContent"),/different dimensions/);
    assert.ok(await visible('#calculator-error'));
    await type('7/8');assert.match(await result(),/0\.875/);
    console.log('PASS dimension error and recovery');
    await type('12');await tap('[data-move="-1"]');await tap('[data-insert="+"]');
    assert.equal(await value(),'1+2');assert.match(await result(),/3/);
    console.log('PASS operator keys preserve keyboard and cursor position');
    await type(Array(30).fill('123456789').join('+'));
    assert.ok(await visible('.mobile-keys'));assert.ok(await visible('#mobile-result'));
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
    await screenshot('calculator-redesign-long.png');
    await tap('#expand-expression');
    assert.ok(await evaluate("document.querySelector('.app-shell').classList.contains('source-expanded')"));
    await tap('#expand-expression');
    console.log('PASS long expression wrapping, no page overflow and expanded editor');
    await type('s');
    if(await visible('#next-suggestions')) {await tap('#next-suggestions');assert.ok(await evaluate("document.getElementById('next-suggestions').getAttribute('aria-label').includes('page 2')"));assert.ok(await visible('#completion-2'),'Next suggestion page stays visible');}
    console.log('PASS suggestion paging');
    await type('1 m');
    await tap('#result-details');
    assert.ok(await evaluate("document.getElementById('details-dialog').open"));
    await tap('#result-unit-search');await call('Input.insertText',{text:'cm'});await pause(100);
    await tap('[data-unit="eq:cm"]');await pause(200);
    assert.match(await evaluate("document.getElementById('calculator-result').textContent.replace(/\\s/g,'')"),/100cm/);
    await screenshot('calculator-redesign-units.png');
    await tap('#details-dialog [data-close-dialog]');
    assert.match(await result(),/100cm/);
    console.log('PASS result dialog, unit search and conversion');
    await tap('#save-calculation');await tap('#saved-button');await tap('#saved-list .saved-restore');
    assert.match(await result(),/100cm/);
    console.log('PASS explicit output unit survives save and restore');
    await pause(350);if(await visible('#finish-editing')) await tap('#finish-editing');await pause(350);
    await tap('#constants-button');
    await tap('#menu-search');await call('Input.insertText',{text:'Planck'});await pause(200);
    assert.ok(await evaluate("document.querySelectorAll('#menu-items button').length>0"));
    assert.ok(await visible('#menu-close'));await tap('#menu-close');
    console.log('PASS searchable symbol dialog with keyboard');
    await type('7/8');await tap('#save-calculation');
    await tap('#saved-button');
    assert.ok(await evaluate("document.querySelector('#saved-list .saved-restore')!==null"));
    await tap('#saved-list .saved-restore');
    assert.equal(await value(),'7/8');
    console.log('PASS saved calculation and restore');
    await tap('#angle-toggle');await type('sin(30)');assert.match(await result(),/0\.5/);
    await tap('#angle-toggle');
    console.log('PASS angle mode');
    await pause(350);if(await visible('#finish-editing')) await tap('#finish-editing');await pause(350);
    await tap('#examples-button');await tap('#examples .example-button');
    assert.equal(await value(),'hbar * 10 GHz');
    assert.equal(await evaluate("document.querySelectorAll('dialog[open]').length"),0);
    console.log('PASS examples and return to editing');
    }
    await pause(350);if(await visible('#finish-editing')) await tap('#finish-editing');await pause(350);
    await screenshot('calculator-redesign-idle.png');
    const display=execFileSync(adb,['shell','wm','size'],{encoding:'utf8'});
    const override=display.match(/Override size: (\d+x\d+)/)?.[1];
    try {
        execFileSync(adb,['shell','wm','size','900x1800']);await pause(700);
        await type('hbar * 10 GHz');
        assert.ok(await visible('.mobile-keys'),'Keys on a narrow screen');
        assert.ok(await visible('#mobile-result'),'Result on a narrow screen');
        await screenshot('calculator-redesign-narrow.png');
        console.log('PASS narrow Android display with math keyboard');
    } finally {execFileSync(adb,['shell','wm','size',override || 'reset']);await pause(700);}
    await pause(350);if(await visible('#finish-editing')) await tap('#finish-editing');await pause(350);
    const rotation=execFileSync(adb,['shell','settings','get','system','user_rotation'],{encoding:'utf8'}).trim();
    const automatic=execFileSync(adb,['shell','settings','get','system','accelerometer_rotation'],{encoding:'utf8'}).trim();
    try {
        execFileSync(adb,['shell','settings','put','system','accelerometer_rotation','0']);
        execFileSync(adb,['shell','settings','put','system','user_rotation','1']);await pause(900);
        await type('sqrt(16)+2^3');
        await screenshot('calculator-redesign-landscape.png');
        assert.ok(await visible('.mobile-keys'),'Keys in landscape');
        assert.ok(await visible('#mobile-result'),'Result in landscape');
        await screenshot('calculator-redesign-landscape.png');
        await type('hba');assert.ok(await visible('#completion-0'),'Landscape suggestion visible');
        await screenshot('calculator-math-landscape-suggestions.png');
        await tap('#completion-0');assert.equal(await value(),'hbar');
        assert.ok(await visible('#mobile-result'));
        console.log('PASS landscape Android display, suggestions and math keyboard');
    } finally {
        execFileSync(adb,['shell','settings','put','system','user_rotation',rotation==='null'?'0':rotation]);
        execFileSync(adb,['shell','settings','put','system','accelerometer_rotation',automatic==='null'?'1':automatic]);await pause(700);
    }
    await call('Network.enable');
    try {
        await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
        await call('Page.reload');await pause(900);await type('sqrt(16)+2^3');
        assert.match(await result(),/12/);
        assert.ok(await visible('.mobile-keys'));
        console.log('PASS offline reload and calculation');
    } finally {await call('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});}
    assert.deepEqual(errors,[],'Browser runtime exceptions');
    console.log('PASS no browser runtime exceptions');
} finally {
    await evaluate(`localStorage.${saved===null?'removeItem':'setItem'}('physics-calculator-saved-v1'${saved===null?'':','+JSON.stringify(saved)})`);
    await call('Page.reload');await pause(500);
    await evaluate('document.activeElement.blur()');
    socket.close();
}
