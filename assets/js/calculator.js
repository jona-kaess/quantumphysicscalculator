(() => {
    const engine=PhysicsEngine, $=id=>document.getElementById(id), input=$('expression');
    let menuMode='', start=0, end=0, resultChoices=[], selectedUnit='', manualUnit=false, suggestions=[], suggestionIndex=0, completionRange=null;
    const versions=new WeakMap();
    const fmt=x=>Number(x.toPrecision(9)).toString().replace(/e([+-]?\d+)/,'E$1');
    const mathNumber=x=>String(x).replace(/[eE]([+-]?\d+)/,(_,power)=>`\\times 10^{${Number(power)}}`);
    function complexNumber(real,imag=0) {
        const magnitude=Math.hypot(real,imag); if(magnitude && Math.abs(real)<magnitude*1e-14) real=0; if(magnitude && Math.abs(imag)<magnitude*1e-14) imag=0;
        if(!imag) return mathNumber(fmt(real));
        const term=`${Math.abs(imag)===1?'':mathNumber(fmt(Math.abs(imag)))}i`;
        return real?`${mathNumber(fmt(real))} ${imag<0?'-':'+'} ${term}`:`${imag<0?'-':''}${term}`;
    }
    function mathUnit(unit) {
        const symbols={'rad/s':'rad/s','°C':'{}^\\circ C','°F':'{}^\\circ F','Δ°C':'\\Delta{}^\\circ C','Δ°F':'\\Delta{}^\\circ F'};
        const customary=unit.match(/^([A-Za-z_]+)_(US|UK)$/);
        if(customary) return `\\mathrm{${customary[1].replaceAll('_','\\,')}}_{\\mathrm{${customary[2]}}}`;
        return symbols[unit] || `\\mathrm{${unit.replaceAll('_','\\_').replace(/\^(-?\d+)/g,'^{$1}').replace(/\s+/g,'\\,')}}`;
    }
    function renderMath(box,tex) {
        const version=(versions.get(box)||0)+1; versions.set(box,version);
        box.textContent=`\\( ${tex} \\)`;
        if(window.MathJax?.typesetPromise) MathJax.startup.promise.then(()=>{
            if(versions.get(box)!==version || !box.isConnected) return;
            MathJax.typesetClear([box]); return MathJax.typesetPromise([box]);
        }).catch(()=>{});
    }
    function invalidate(box) {versions.set(box,(versions.get(box)||0)+1);box.textContent='';}
    const siLabels=['m','kg','s','A','K','mol','cd'];
    function siUnit(dim) {
        const num=[],den=[]; dim.forEach((x,i)=>{if(x) (x>0?num:den).push(siLabels[i]+(Math.abs(x)===1?'':`^${Math.abs(x)}`));});
        return (num.join(' ')||'1')+(den.length?' / '+den.join(' '):'');
    }
    function showResultChoice() {
        const choice=resultChoices.find(row=>row.key===selectedUnit);
        if(!choice) return;
        const scaled=engine.scaledChoice(choice);
        renderMath($('calculator-result'),`${complexNumber(scaled.value,scaled.imag)}\\,\\color{teal}{${mathUnit(scaled.label)}}`);
        $('result-relation').hidden=!choice.via;
        if(choice.via) renderMath($('result-relation'),`\\text{via } ${choice.via}`); else invalidate($('result-relation'));
        $('result-prefix').hidden=!scaled.prefix;
        if(scaled.prefix) renderMath($('result-prefix'),`\\mathrm{${scaled.prefix==='µ'?'\\mu':scaled.prefix}}:\\; \\times 10^{${scaled.power}}`); else invalidate($('result-prefix'));
    }
    function filterResultUnits() {
        const query=$('result-unit-search').value.trim().toLowerCase(), select=$('result-unit'); select.replaceChildren();
        const matches=resultChoices.filter(row=>`${row.label} ${row.group}`.toLowerCase().includes(query));
        matches.forEach(row=>{const option=document.createElement('option'); option.value=row.key; option.textContent=`${row.label} — ${row.group}`; select.append(option);});
        $('result-unit-empty').hidden=matches.length>0; select.hidden=!matches.length;
        if(matches.some(row=>row.key===selectedUnit)) select.value=selectedUnit;
    }
    function update() {
        const text=input.value.trim(), panel=$('result-panel');
        if(!text) { $('calculator-error').textContent=''; $('expression-preview').hidden=true; $('input-prefixes').hidden=true; invalidate($('expression-preview')); panel.hidden=true; return; }
        try {
            const result=engine.evaluate(text,$('angle-mode').value==='1'?'deg':'rad'); $('calculator-error').textContent=''; panel.hidden=false; $('expression-preview').hidden=false; renderMath($('expression-preview'),result.latex);
            $('input-prefixes').hidden=!result.usedPrefixes.length;
            if(result.usedPrefixes.length) renderMath($('input-prefixes'),result.usedPrefixes.map(p=>`\\mathrm{${['µ','mu','u'].includes(p.symbol)?'\\mu':p.symbol}}:\\;\\times 10^{${p.power}}`).join(',\\quad '));
            $('dimension-tag').textContent=engine.dimensionName(result.dim);
            resultChoices=engine.conversions(result); $('conversion-section').hidden=!resultChoices.length;
            if(!manualUnit || !resultChoices.some(row=>row.key===selectedUnit)) selectedUnit=engine.chooseDefault(result,text,resultChoices);
            if(resultChoices.length) {filterResultUnits(); showResultChoice();}
            else { const unit=siUnit(result.dim); renderMath($('calculator-result'),`${complexNumber(result.value,result.imag)}${unit==='1'?'':`\\,${mathUnit(unit)}`}`); $('result-relation').hidden=true; $('result-prefix').hidden=true; }
            $('temperature-note').hidden=engine.dimensionName(result.dim)!=='temperature';
            $('constant-section').hidden=!result.used.length; const constants=$('constant-list'); constants.replaceChildren();
            result.used.forEach(key=>{
                const c=engine.constants[key], el=document.createElement('div'), label=document.createElement('span'), math=document.createElement('span'), source=document.createElement('small');
                label.textContent=`${c.name}: `; source.textContent=` — ${c.source}`;
                el.append(label,math,source); constants.append(el);
                const value=String(c.sourceValue ?? c.value);
                renderMath(math,`${c.latex} = ${mathNumber(value)}${c.unit?`\\,${mathUnit(c.unit)}`:''}`);
            });
        } catch(err) {panel.hidden=true; $('calculator-error').textContent=err.message; $('expression-preview').hidden=true; $('input-prefixes').hidden=true; invalidate($('expression-preview'));}
    }
    function hideSuggestions() { $('autocomplete-list').hidden=true; input.setAttribute('aria-expanded','false'); input.removeAttribute('aria-activedescendant'); suggestions=[]; }
    function acceptSuggestion(index) {
        if(!suggestions[index] || !completionRange) return;
        const item=suggestions[index], value=item.type==='function'?`${item.symbol}()`:item.symbol;
        input.setRangeText(value,completionRange.start,completionRange.end,'end'); if(item.type==='function') input.setSelectionRange(input.selectionStart-1,input.selectionStart-1); hideSuggestions(); input.focus(); manualUnit=false; $('result-unit-search').value=''; update(); if(item.type==='function') $('calculator-error').textContent='';
    }
    function showSuggestions() {
        if(document.activeElement!==input || !$('insert-menu').hidden) return hideSuggestions();
        completionRange=engine.completions(input.value,input.selectionStart);
        suggestions=completionRange.items; suggestionIndex=0;
        const list=$('autocomplete-list'); list.replaceChildren();
        if(!suggestions.length) return hideSuggestions();
        if($('calculator-error').textContent.startsWith('Unknown symbol')) $('calculator-error').textContent='';
        suggestions.forEach((item,index)=>{
            const option=document.createElement('button'), symbol=document.createElement('strong'), description=document.createElement('span');
            option.type='button'; option.id=`completion-${index}`; option.className='autocomplete-option'; option.setAttribute('role','option');
            symbol.className=item.type==='unit'?'unit-color':'constant-color'; symbol.textContent=item.symbol; description.textContent=`${item.name} · ${item.type}`;
            option.append(symbol,description); option.addEventListener('mousedown',e=>e.preventDefault()); option.addEventListener('click',()=>acceptSuggestion(index)); list.append(option);
        });
        list.hidden=false; input.setAttribute('aria-expanded','true'); markSuggestion();
    }
    function markSuggestion() {
        [...$('autocomplete-list').children].forEach((option,index)=>option.setAttribute('aria-selected',String(index===suggestionIndex)));
        input.setAttribute('aria-activedescendant',`completion-${suggestionIndex}`);
    }
    function insert(value) {const isFunction=menuMode==='functions' && Object.hasOwn(engine.functions,value); const text=isFunction?`${value}()`:value; input.setRangeText(text,start,end,'end'); if(isFunction) input.setSelectionRange(input.selectionStart-1,input.selectionStart-1); closeMenu(); hideSuggestions(); input.focus(); manualUnit=false; $('result-unit-search').value=''; update(); if(isFunction) $('calculator-error').textContent='';}
    function closeMenu() { $('insert-menu').hidden=true; for(const id of ['constants-button','units-button','functions-button']) $(id).setAttribute('aria-expanded','false'); }
    function populateMenu() {
        const query=$('menu-search').value.trim(), list=$('menu-items'); list.replaceChildren();
        let data;
        if(menuMode==='constants') {
            data=engine.constantItems();
        } else if(menuMode==='functions') data=[...Object.entries(engine.functions).map(([symbol,name])=>({symbol,name})),{symbol:'i',name:'Imaginary unit'},{symbol:'euler',name:'Euler number'}];
        else data=Object.values(engine.units).filter(u=>!u.prefix && ($('unit-group').value==='Any'||u.group===$('unit-group').value)).map(u=>({symbol:u.symbol,name:u.name}));
        // A typed prefixed symbol still finds its base unit without adding prefixed duplicates.
        const prefixed=menuMode==='units'?Object.values(engine.units).find(u=>u.prefix && u.symbol===query):null;
        const search=prefixed?prefixed.base:query;
        engine.searchItems(data,search).forEach(x=>{const b=document.createElement('button'); b.type='button'; b.className='menu-option'; const sym=document.createElement('strong'),name=document.createElement('span'); sym.className=menuMode==='units'?'unit-color':'constant-color'; sym.textContent=x.symbol; name.textContent=x.name; b.append(sym,name); b.addEventListener('click',()=>insert(x.symbol)); list.append(b);});
        if(!list.childElementCount) list.textContent='No matching items.';
    }
    function openMenu(mode) {
        start=input.selectionStart; end=input.selectionEnd; menuMode=mode; hideSuggestions(); $('insert-menu').hidden=false;
        $('constants-button').setAttribute('aria-expanded',String(mode==='constants')); $('units-button').setAttribute('aria-expanded',String(mode==='units'));
        $('functions-button').setAttribute('aria-expanded',String(mode==='functions'));
        $('group-label').hidden=mode!=='units'; $('unit-group').hidden=mode!=='units'; $('menu-search').value='';
        if(mode==='units') {const sel=$('unit-group');sel.replaceChildren(); ['Any',...[...new Set(Object.values(engine.units).map(u=>u.group))].sort()].forEach(group=>{const o=document.createElement('option');o.value=group;o.textContent=group;sel.append(o);});}
        populateMenu(); $('menu-search').focus();
    }
    input.addEventListener('input',()=>{ $('result-unit-search').value=''; update(); showSuggestions();});
    $('angle-mode').addEventListener('input',()=>{$('angle-label').textContent=$('angle-mode').value==='1'?'Degrees':'Radians'; update();});
    input.addEventListener('click',showSuggestions);
    input.addEventListener('blur',()=>setTimeout(()=>{if(document.activeElement!==input) {hideSuggestions(); update();}},0));
    input.addEventListener('keydown',e=>{
        if($('autocomplete-list').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
        if(e.key==='ArrowDown'||e.key==='ArrowUp') {e.preventDefault(); suggestionIndex=(suggestionIndex+(e.key==='ArrowDown'?1:-1)+suggestions.length)%suggestions.length; markSuggestion();}
        else if(e.key==='Enter'||e.key==='Tab') {e.preventDefault(); acceptSuggestion(suggestionIndex);}
        else if(e.key==='Escape') {e.preventDefault(); hideSuggestions();}
    });
    $('result-unit-search').addEventListener('input',filterResultUnits);
    $('result-unit-search').addEventListener('keydown',e=>{if(e.key==='Enter' && !$('result-unit').hidden){e.preventDefault();selectedUnit=$('result-unit').options[0].value;$('result-unit').value=selectedUnit;manualUnit=true;showResultChoice();}});
    $('result-unit').addEventListener('change',()=>{selectedUnit=$('result-unit').value; manualUnit=true; showResultChoice();});
    for(const [id,mode] of [['constants-button','constants'],['units-button','units'],['functions-button','functions']]) {$(id).addEventListener('mousedown',e=>e.preventDefault()); $(id).addEventListener('click',()=>openMenu(mode));}
    $('menu-search').addEventListener('input',populateMenu); $('unit-group').addEventListener('change',populateMenu); $('menu-close').addEventListener('click',()=>{closeMenu();input.focus();});
    $('menu-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault(); $('menu-items').querySelector('button')?.click();}});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['k','e','y'].includes(e.key.toLowerCase())) {e.preventDefault();openMenu({k:'constants',e:'units',y:'functions'}[e.key.toLowerCase()]);} else if(e.key==='Escape'&&!$('insert-menu').hidden){closeMenu();input.focus();}});
    ['hbar * 10 GHz','7/8','1E6 eV','20 degC - 10 degC','2 kg * 9.81 m / s^2','10 GHz_energy'].forEach(example=>{const b=document.createElement('button');b.type='button';b.className='example-button';b.textContent=example;b.addEventListener('click',()=>{input.value=example;input.focus();manualUnit=false;$('result-unit-search').value='';update();});$('examples').append(b);});
})();
