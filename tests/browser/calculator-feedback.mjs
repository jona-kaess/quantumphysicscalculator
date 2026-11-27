// Real browser regression checks. Start Chrome with --remote-debugging-port=9333
// or set CDP_PORT=9222 for Android Chrome forwarded through adb.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const port=process.env.CDP_PORT || '9333',origin=process.env.CALCULATOR_TEST_URL || 'http://localhost:5000/';
const tabs=await(await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const tab=tabs.filter(t=>t.type==='page'&&t.url.startsWith(origin)).sort((a,b)=>Number(b.id)-Number(a.id))[0];
assert.ok(tab,'Open the local calculator in the test browser.');
const socket=new WebSocket(tab.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
let touchTyping=false;
let id=0;const pending=new Map(),errors=[];
socket.onmessage=({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
const call=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params}));setTimeout(()=>{if(pending.delete(n))reject(Error('Timeout: '+method));},12000).unref();});
const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function ready() {const deadline=Date.now()+15000;while(!await evaluate("document.readyState==='complete' && window.PhysicsMath && !document.getElementById('math-expression').hidden")){if(Date.now()>deadline)throw Error('Calculator did not initialize');await pause(100);}await pause(120);}

const state=()=>evaluate(`({value:document.getElementById('expression').value,latex:document.getElementById('math-expression').value,error:document.getElementById('calculator-error').textContent,result:document.getElementById('mobile-result-value').textContent.replace(/\\s/g,''),incomplete:document.getElementById('math-expression').dataset.incomplete})`);
async function key(key,code,text=key) {
    await call('Input.dispatchKeyEvent',{type:'keyDown',key,code,text,unmodifiedText:text});
    await call('Input.dispatchKeyEvent',{type:'keyUp',key,code});
    await pause(35);
}
async function type(text) {
    assert.equal(await evaluate("document.getElementById('math-expression').hasFocus()"),true,'Editor must hold keyboard focus before typing');
    for(const char of text) {
        const code=/[a-z]/i.test(char)?'Key'+char.toUpperCase():/\d/.test(char)?'Digit'+char:char===' '?'Space':char==='/'?'Slash':char==='*'?'Digit8':char===','?'Comma':char==='.'?'Period':undefined;
        if(touchTyping && !['*','/',';',','].includes(char))await call('Input.insertText',{text:char});
        else if(touchTyping && char===',') {await evaluate("document.getElementById('math-expression').executeCommand('insertDecimalSeparator')");await pause(35);}
        else await key(char,code);
    }
    await pause(180);
}
async function clear() {await evaluate(`(()=>{const e=document.getElementById('expression');e.value='';e.dispatchEvent(new Event('input',{bubbles:true}));const mf=document.getElementById('math-expression');mf.focus();mf.position=mf.lastOffset;})()`);await pause(250);await click('#math-expression');await pause(120);}
async function click(selector) {
    const r=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    if(touchTyping) {await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[r]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
    else {await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...r});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...r});}
    await pause(180);
}
async function tapKeyText(text) {
    const selector=await evaluate(`(()=>{const keys=[...document.querySelectorAll('.MLK__layer.is-visible .MLK__row > div')];const key=keys.find(e=>e.textContent.trim()===${JSON.stringify(text)});if(!key)throw Error('Missing key: '+${JSON.stringify(text)});return '#'+key.id;})()`);
    await click(selector);
}
async function screenshot(name) {const r=await call('Page.captureScreenshot',{format:'png'});await writeFile('/tmp/calculator-'+name+'.png',Buffer.from(r.data,'base64'));}
async function geometry(label) {
    const failures=await evaluate(`(()=>{const v=visualViewport,bottom=v.offsetTop+v.height-(PhysicsMath.keyboardHeight()||0),bad=[];for(const selector of ['#math-expression','#mobile-result','#autocomplete-list:not([hidden])','#settings-button']){const e=document.querySelector(selector);if(!e || e.hidden || !e.getBoundingClientRect().height)continue;const r=e.getBoundingClientRect();if(r.top<v.offsetTop-1 || r.bottom>bottom+1 || r.right>v.width+1 || r.left<0)bad.push({selector,rect:r.toJSON(),bottom});}return bad;})()`);
    assert.deepEqual(failures,[],label+' layout');
}
await call('Runtime.enable');await call('Page.enable');
let savedSettings;
try {
    await call('Page.navigate',{url:origin+'?feedback-test='+Date.now()});await ready();
    savedSettings=await evaluate("localStorage.getItem('physics-calculator-settings-v1')");
    await evaluate("localStorage.removeItem('physics-calculator-settings-v1')");await call('Page.reload',{ignoreCache:true});await ready();
    const formats=port!=='9333'?[['phone',null,null,true]]:[['laptop',1440,900,false],['tablet',820,1180,true],['tablet-landscape',1180,820,true],['phone-small',360,740,true]];
    for(const [name,width,height,touch] of formats) {
        touchTyping=touch;
        if(width) {await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:touch});await call('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:touch?5:1});}
        await call('Page.reload',{ignoreCache:true});await ready();
        await clear();await type('hbar 5');let s=await state();assert.equal(s.error,'',JSON.stringify(s));assert.match(s.value,/hbar\s+5/);assert.match(s.latex,/qpcC/);
        console.log('PASS '+name+' typed hbar followed by number');
        for(const expression of ['1 T','1T','1GHz']) {await clear();await type(expression);s=await state();assert.equal(s.error,'',JSON.stringify(s));assert.match(s.latex,/#84dbce/);assert.ok(!s.latex.includes('qpcU'),'Unit recognition must preserve continued typing');}
        await clear();await type('sin(0)');s=await state();assert.equal(s.error,'',JSON.stringify(s));assert.match(s.latex,/#efc18d/);

        await clear();await type('12/');s=await state();assert.match(s.latex,/\\frac\{12\}/);await type('4');s=await state();assert.equal(s.error,'',JSON.stringify(s));assert.equal(s.result,'3');
        await clear();await type('2*3');s=await state();assert.equal(s.error,'',JSON.stringify(s));assert.equal(s.result,'6');
        await clear();await type('gamma_e eq GHz/T');s=await state();assert.equal(s.error,'',JSON.stringify(s));assert.equal(s.incomplete,'false',JSON.stringify(s));assert.match(s.latex,/qpcC/);assert.ok(s.result,JSON.stringify(s));assert.ok(Number.isFinite(await evaluate(`PhysicsEngine.requestedConversion(PhysicsEngine.evaluate('gamma_e'),'frac(GHz,T)').value`)));assert.match(s.value,/eq/);
        console.log('PASS '+name+' fraction navigation, multiplication and composite unit conversion');
        if(touch)assert.equal(await evaluate('mathVirtualKeyboard.visible'),true,name+' touch keyboard');
        await geometry(name);await screenshot(name+'-feedback');
        await click('#settings-button');await evaluate("(()=>{const e=document.getElementById('setting-keyboardLayout');e.value='qwertz';e.dispatchEvent(new Event('change',{bubbles:true}));})()");
        assert.equal(await evaluate('mathVirtualKeyboard.alphabeticLayout'),'qwertz');
        for(const [setting,value] of [['decimalSeparator',','],['resultFormat','scientific'],['precision','6'],['unitPrefixes','false']])await evaluate(`(()=>{const e=document.getElementById('setting-${setting}');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
        await screenshot(name+'-settings');await click('#settings-dialog [data-close-dialog]');
        await clear();
        if(touch) {for(const char of '1,25*2') {if(char===',')await click('.qpc-decimal-key');else if(char==='*')await click('.qpc-multiply-key');else await tapKeyText(char);}}
        else await type('1,25*2');
        s=await state();assert.equal(s.error,'',JSON.stringify(s));assert.match(s.result,/2,5.*10/);assert.match(s.latex,/\{,\}/);
        if(name==='laptop') {
            for(const layout of ['azerty','qwerty','dvorak','qwertz']) {
                await click('#settings-button');await evaluate(`(()=>{const e=document.getElementById('setting-keyboardLayout');e.value='${layout}';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);
                await click('#settings-dialog [data-close-dialog]');assert.equal(await evaluate('mathVirtualKeyboard.alphabeticLayout'),layout);
            }
            console.log('PASS configurable keyboard layouts');
        }
        if(touch) {
            await clear();await click('.qpc-fraction-key');await tapKeyText('1');
            await click('#settings-button');await evaluate("document.getElementById('setting-precision').dispatchEvent(new Event('change',{bubbles:true}))");await click('#settings-dialog [data-close-dialog]');
            s=await state();assert.match(s.latex,/\\frac/);assert.equal(s.incomplete,'true','Settings retain an unfinished fraction');
            await click('#math-expression');await pause(220);await click('.qpc-next-key');await tapKeyText('2');s=await state();assert.equal(s.error,'',JSON.stringify(s));assert.equal(await evaluate("PhysicsEngine.evaluate(document.getElementById('expression').value).value"),0.5);
        }
        const prefs=await evaluate("JSON.parse(localStorage.getItem('physics-calculator-settings-v1'))");assert.equal(prefs.decimalSeparator,',');assert.equal(prefs.resultFormat,'scientific');assert.equal(prefs.precision,6);
        await click('#settings-button');await click('#settings-reset');await click('#settings-dialog [data-close-dialog]');
        await call('Page.reload');await ready();
        await clear();await type('hba');await geometry(name+' suggestions');
        const overflow=await evaluate("[...document.querySelectorAll('.autocomplete-option')].filter(e=>!e.hidden).some(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)");assert.equal(overflow,false,name+' suggestion overflow');
        await screenshot(name+'-suggestions');
        await clear();await type('Wien');await geometry(name+' long suggestions');assert.ok(await evaluate("document.querySelectorAll('.autocomplete-option:not([hidden])').length>0"));
        assert.equal(await evaluate("[...document.querySelectorAll('.autocomplete-option')].filter(e=>!e.hidden).some(e=>e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)"),false,name+' long suggestion overflow');
        await screenshot(name+'-long-suggestions');console.log('PASS '+name+' settings, decimal comma and suggestions');
    }
    assert.deepEqual(errors,[],'No browser exceptions');
} catch(error) {await screenshot('feedback-failure');console.log(await state());throw error;}
finally {
    if(savedSettings!==undefined)await evaluate(`(()=>{const value=${JSON.stringify(savedSettings)};if(value===null)localStorage.removeItem('physics-calculator-settings-v1');else localStorage.setItem('physics-calculator-settings-v1',value);})()`);
    if(port==='9333'){await call('Emulation.clearDeviceMetricsOverride');await call('Emulation.setTouchEmulationEnabled',{enabled:false});}
    await call('Page.reload');socket.close();
}
console.log('PASS all feedback regressions');
