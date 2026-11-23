(() => {
    const engine=PhysicsEngine, $=id=>document.getElementById(id), input=$('expression');
    let menuMode='', start=0, end=0, renderVersion=0;
    const fmt=x=>Number(x.toPrecision(9)).toString().replace(/e([+-]?\d+)/,'E$1');
    const siLabels=['m','kg','s','A','K','mol','cd'];
    function siUnit(dim) {
        const num=[],den=[]; dim.forEach((x,i)=>{if(x) (x>0?num:den).push(siLabels[i]+(Math.abs(x)===1?'':`^${Math.abs(x)}`));});
        return (num.join(' ')||'1')+(den.length?' / '+den.join(' '):'');
    }
    async function renderMath(tex) {
        const box=$('expression-preview'), version=++renderVersion;
        box.textContent=`\\( ${tex} \\)`;
        if(window.MathJax?.typesetPromise) {
            try { await MathJax.startup.promise; if(version!==renderVersion)return; MathJax.typesetClear([box]); await MathJax.typesetPromise([box]); } catch (_) { /* TeX remains readable if MathJax is unavailable. */ }
        }
    }
    function update() {
        const text=input.value.trim(), panel=$('result-panel');
        if(!text) { $('calculator-error').textContent=''; $('expression-preview').textContent='Your expression will appear here.'; panel.hidden=true; ++renderVersion; return; }
        try {
            const result=engine.evaluate(text); $('calculator-error').textContent=''; panel.hidden=false; renderMath(result.latex);
            $('dimension-tag').textContent=engine.dimensionName(result.dim);
            $('calculator-result').textContent=`${fmt(result.value)}${siUnit(result.dim)==='1'?'':' '+siUnit(result.dim)}`;
            const conversions=engine.conversions(result), list=$('conversion-list'); list.replaceChildren();
            $('conversion-section').hidden=!conversions.length;
            conversions.forEach(row=>{const item=document.createElement('div'), value=document.createElement('strong'), unit=document.createElement('span'), group=document.createElement('small'); item.className='conversion-item'; value.textContent=fmt(row.value); unit.textContent=row.label; unit.className='unit-color'; group.textContent=row.group; item.append(value,unit,group); list.append(item);});
            $('temperature-note').hidden=engine.dimensionName(result.dim)!=='temperature';
            $('constant-section').hidden=!result.used.length; const constants=$('constant-list'); constants.replaceChildren();
            result.used.forEach(key=>{const c=engine.constants[key], el=document.createElement('div'); el.textContent=`${c.name} (${key}) = ${fmt(c.value)} ${c.unit}`; constants.append(el);});
        } catch(err) {panel.hidden=true; $('calculator-error').textContent=err.message; $('expression-preview').textContent='Continue typing to see your formatted expression.'; ++renderVersion;}
    }
    function insert(value) {
        input.setRangeText(value,start,end,'end'); closeMenu(); input.focus(); update();
    }
    function closeMenu() { $('insert-menu').hidden=true; $('constants-button').setAttribute('aria-expanded','false'); $('units-button').setAttribute('aria-expanded','false'); }
    function populateMenu() {
        const query=$('menu-search').value.toLowerCase(), list=$('menu-items'); list.replaceChildren();
        const data=menuMode==='constants'?Object.entries(engine.constants).map(([symbol,c])=>({symbol,name:c.name})):Object.values(engine.units).filter(u=>u.group===$('unit-group').value).map(u=>({symbol:u.symbol,name:u.name}));
        data.filter(x=>`${x.symbol} ${x.name}`.toLowerCase().includes(query)).forEach(x=>{const b=document.createElement('button'); b.type='button'; b.className='menu-option'; const sym=document.createElement('strong'),name=document.createElement('span'); sym.className=menuMode==='units'?'unit-color':'constant-color'; sym.textContent=x.symbol; name.textContent=x.name; b.append(sym,name); b.addEventListener('click',()=>insert(x.symbol)); list.append(b);});
        if(!list.childElementCount) list.textContent='No matching items.';
    }
    function openMenu(mode) {
        start=input.selectionStart; end=input.selectionEnd; menuMode=mode; $('insert-menu').hidden=false;
        $('constants-button').setAttribute('aria-expanded',String(mode==='constants')); $('units-button').setAttribute('aria-expanded',String(mode==='units'));
        $('group-label').hidden=mode!=='units'; $('unit-group').hidden=mode!=='units'; $('menu-search').value='';
        if(mode==='units') {const sel=$('unit-group');sel.replaceChildren(); [...new Set(Object.values(engine.units).map(u=>u.group))].sort().forEach(group=>{const o=document.createElement('option');o.value=group;o.textContent=group;sel.append(o);});}
        populateMenu(); $('menu-search').focus();
    }
    input.addEventListener('input',update);
    $('constants-button').addEventListener('mousedown',e=>e.preventDefault()); $('units-button').addEventListener('mousedown',e=>e.preventDefault());
    $('constants-button').addEventListener('click',()=>openMenu('constants')); $('units-button').addEventListener('click',()=>openMenu('units'));
    $('menu-search').addEventListener('input',populateMenu); $('unit-group').addEventListener('change',populateMenu); $('menu-close').addEventListener('click',()=>{closeMenu();input.focus();});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['k','e'].includes(e.key.toLowerCase())) {e.preventDefault();openMenu(e.key.toLowerCase()==='k'?'constants':'units');} else if(e.key==='Escape'&&!$('insert-menu').hidden){closeMenu();input.focus();}});
    ['hbar * 10 GHz','7/8','1E6 eV','20 degC - 10 degC','2 kg * 9.81 m / s^2','10 GHz_energy'].forEach(example=>{const b=document.createElement('button');b.type='button';b.className='example-button';b.textContent=example;b.addEventListener('click',()=>{input.value=example;input.focus();update();});$('examples').append(b);});
})();
