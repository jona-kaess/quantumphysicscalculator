(() => {
    const engine=PhysicsEngine, $=id=>document.getElementById(id), input=$('expression');
    let menuMode='', start=0, end=0, renderVersion=0, resultChoices=[], selectedUnit='', manualUnit=false;
    const fmt=x=>Number(x.toPrecision(9)).toString().replace(/e([+-]?\d+)/,'E$1');
    const siLabels=['m','kg','s','A','K','mol','cd'];
    function siUnit(dim) {
        const num=[],den=[]; dim.forEach((x,i)=>{if(x) (x>0?num:den).push(siLabels[i]+(Math.abs(x)===1?'':`^${Math.abs(x)}`));});
        return (num.join(' ')||'1')+(den.length?' / '+den.join(' '):'');
    }
    function showResultChoice() {
        const choice=resultChoices.find(row=>row.label===selectedUnit);
        if(choice) { $('calculator-result').textContent=fmt(choice.value); $('result-unit-label').textContent=choice.label; }
    }
    function filterResultUnits() {
        const query=$('result-unit-search').value.trim().toLowerCase(), select=$('result-unit'); select.replaceChildren();
        const matches=resultChoices.filter(row=>`${row.label} ${row.group}`.toLowerCase().includes(query));
        matches.forEach(row=>{const option=document.createElement('option'); option.value=row.label; option.textContent=`${row.label} — ${row.group}`; select.append(option);});
        $('result-unit-empty').hidden=matches.length>0; select.hidden=!matches.length;
        if(matches.some(row=>row.label===selectedUnit)) select.value=selectedUnit;
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
        if(!text) { $('calculator-error').textContent=''; $('expression-preview').hidden=true; $('expression-preview').textContent=''; panel.hidden=true; ++renderVersion; return; }
        try {
            const result=engine.evaluate(text); $('calculator-error').textContent=''; panel.hidden=false; $('expression-preview').hidden=false; renderMath(result.latex);
            $('dimension-tag').textContent=engine.dimensionName(result.dim);
            resultChoices=engine.conversions(result); $('conversion-section').hidden=!resultChoices.length;
            if(!manualUnit || !resultChoices.some(row=>row.label===selectedUnit)) selectedUnit=engine.chooseDefault(result,text,resultChoices);
            if(resultChoices.length) {filterResultUnits(); showResultChoice();}
            else { $('calculator-result').textContent=fmt(result.value); $('result-unit-label').textContent=siUnit(result.dim)==='1'?'':siUnit(result.dim); }
            $('temperature-note').hidden=engine.dimensionName(result.dim)!=='temperature';
            $('constant-section').hidden=!result.used.length; const constants=$('constant-list'); constants.replaceChildren();
            result.used.forEach(key=>{const c=engine.constants[key], el=document.createElement('div'); const value=String(c.sourceValue ?? c.value).replace(/e([+-]?\d+)/,'E$1'); el.textContent=`${c.name} (${key}) = ${value} ${c.unit} — ${c.source}`; constants.append(el);});
        } catch(err) {panel.hidden=true; $('calculator-error').textContent=err.message; $('expression-preview').hidden=true; $('expression-preview').textContent=''; ++renderVersion;}
    }
    function insert(value) {
        input.setRangeText(value,start,end,'end'); closeMenu(); input.focus(); manualUnit=false; $('result-unit-search').value=''; update();
    }
    function closeMenu() { $('insert-menu').hidden=true; $('constants-button').setAttribute('aria-expanded','false'); $('units-button').setAttribute('aria-expanded','false'); }
    function populateMenu() {
        const query=$('menu-search').value.trim().toLowerCase(), list=$('menu-items'); list.replaceChildren();
        const data=menuMode==='constants'?Object.entries(engine.constants).map(([symbol,c])=>({symbol,name:c.name})):Object.values(engine.units).filter(u=>$('unit-group').value==='Any'||u.group===$('unit-group').value).map(u=>({symbol:u.symbol,name:u.name}));
        engine.searchItems(data,query).forEach(x=>{const b=document.createElement('button'); b.type='button'; b.className='menu-option'; const sym=document.createElement('strong'),name=document.createElement('span'); sym.className=menuMode==='units'?'unit-color':'constant-color'; sym.textContent=x.symbol; name.textContent=x.name; b.append(sym,name); b.addEventListener('click',()=>insert(x.symbol)); list.append(b);});
        if(!list.childElementCount) list.textContent='No matching items.';
    }
    function openMenu(mode) {
        start=input.selectionStart; end=input.selectionEnd; menuMode=mode; $('insert-menu').hidden=false;
        $('constants-button').setAttribute('aria-expanded',String(mode==='constants')); $('units-button').setAttribute('aria-expanded',String(mode==='units'));
        $('group-label').hidden=mode!=='units'; $('unit-group').hidden=mode!=='units'; $('menu-search').value='';
        if(mode==='units') {const sel=$('unit-group');sel.replaceChildren(); ['Any',...[...new Set(Object.values(engine.units).map(u=>u.group))].sort()].forEach(group=>{const o=document.createElement('option');o.value=group;o.textContent=group;sel.append(o);});}
        populateMenu(); $('menu-search').focus();
    }
    input.addEventListener('input',()=>{manualUnit=false; $('result-unit-search').value=''; update();});
    $('result-unit-search').addEventListener('input',filterResultUnits);
    $('result-unit-search').addEventListener('keydown',e=>{if(e.key==='Enter' && !$('result-unit').hidden){e.preventDefault();selectedUnit=$('result-unit').value;manualUnit=true;showResultChoice();}});
    $('result-unit').addEventListener('change',()=>{selectedUnit=$('result-unit').value; manualUnit=true; showResultChoice();});
    $('constants-button').addEventListener('mousedown',e=>e.preventDefault()); $('units-button').addEventListener('mousedown',e=>e.preventDefault());
    $('constants-button').addEventListener('click',()=>openMenu('constants')); $('units-button').addEventListener('click',()=>openMenu('units'));
    $('menu-search').addEventListener('input',populateMenu); $('unit-group').addEventListener('change',populateMenu); $('menu-close').addEventListener('click',()=>{closeMenu();input.focus();});
    $('menu-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault(); $('menu-items').querySelector('button')?.click();}});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['k','e'].includes(e.key.toLowerCase())) {e.preventDefault();openMenu(e.key.toLowerCase()==='k'?'constants':'units');} else if(e.key==='Escape'&&!$('insert-menu').hidden){closeMenu();input.focus();}});
    ['hbar * 10 GHz','7/8','1E6 eV','20 degC - 10 degC','2 kg * 9.81 m / s^2','10 GHz_energy'].forEach(example=>{const b=document.createElement('button');b.type='button';b.className='example-button';b.textContent=example;b.addEventListener('click',()=>{input.value=example;input.focus();manualUnit=false;$('result-unit-search').value='';update();});$('examples').append(b);});
})();
