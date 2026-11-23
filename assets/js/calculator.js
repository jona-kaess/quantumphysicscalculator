(() => {
    const engine=PhysicsEngine, $=id=>document.getElementById(id), input=$('expression');
    let menuMode='', start=0, end=0, resultChoices=[], selectedUnit='', manualUnit=false, suggestions=[], suggestionIndex=0, completionRange=null;
    let currentLatex='', currentResult=null;
    const savedKey='physics-calculator-saved-v1';
    const readStorage=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
    const writeStorage=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}};
    const versions=new WeakMap();
    const fmt=x=>{
        const rounded=Number(x.toPrecision(9));
        if(rounded && (Math.abs(rounded)<1e-3 || Math.abs(rounded)>=1e9)) return rounded.toExponential().replace(/e([+-]?\d+)/,'E$1');
        return rounded.toString().replace(/e([+-]?\d+)/,'E$1');
    };
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
        if(unit==='ohm') return '\\Omega';
        return symbols[unit] || `\\mathrm{${unit.replaceAll('_','\\_').replace(/([A-Za-z]+)\^0\.5\b/g,'\\sqrt{$1}').replace(/\^(-?\d+(?:\.\d+)?)/g,'^{$1}').replace(/\s+/g,'\\,')}}`;
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
    function highlightExpression() {
        const layer=$('expression-highlight');
        layer.replaceChildren();
        for(const part of engine.highlightTokens(input.value)) {
            if(part.type==='plain') layer.append(document.createTextNode(part.text));
            else {const span=document.createElement('span'); span.className=`syntax-${part.type}`; span.textContent=part.text; layer.append(span);}
        }
        layer.scrollLeft=input.scrollLeft;
    }
    const siLabels=['m','kg','s','A','K','mol','cd'];
    function siUnit(dim) {
        const num=[],den=[]; dim.forEach((x,i)=>{if(x) (x>0?num:den).push(siLabels[i]+(Math.abs(x)===1?'':`^${Math.abs(x)}`));});
        return (num.join(' ')||'1')+(den.length?' / '+den.join(' '):'');
    }
    function showResultChoice() {
        const choice=resultChoices.find(row=>row.key===selectedUnit);
        if(!choice) return;
        const scaled=engine.scaledChoice(choice);
        const tex=`${complexNumber(scaled.value,scaled.imag)}\\,\\color{teal}{${mathUnit(scaled.label)}}`;
        renderMath($('calculator-result'),tex); renderMath($('mobile-result-value'),tex);
        $('result-relation').hidden=!choice.via;
        if(choice.via) renderMath($('result-relation'),`\\text{via } ${choice.via}`); else invalidate($('result-relation'));
        $('result-prefix').hidden=!scaled.prefix;
        if(scaled.prefix) renderMath($('result-prefix'),`\\mathrm{${scaled.prefix==='µ'?'\\mu':scaled.prefix}}:\\; \\times 10^{${scaled.power}}`); else invalidate($('result-prefix'));
    }
    function filterResultUnits() {
        const query=$('result-unit-search').value.trim().toLowerCase(), select=$('result-unit'); select.replaceChildren();
        const matches=resultChoices.filter(row=>`${row.key} ${row.label} ${row.group}`.toLowerCase().includes(query));
        matches.forEach(row=>{const option=document.createElement('option'); option.value=row.key; option.textContent=`${row.group==='Energy equivalent'&&!row.key.startsWith('eq:')?row.key:row.label} — ${row.group}`; select.append(option);});
        $('result-unit-empty').hidden=matches.length>0; select.hidden=!matches.length;
        if(matches.some(row=>row.key===selectedUnit)) select.value=selectedUnit;
    }
    function update() {
        highlightExpression();
        const text=input.value.trim(), panel=$('result-panel');
        $('clear-expression').hidden=!input.value; $('mobile-result').hidden=true;
        if(!text) { currentLatex=''; currentResult=null; $('calculator-error').textContent=''; $('expression-preview').hidden=true; $('input-prefixes').hidden=true; invalidate($('expression-preview')); panel.hidden=true; return; }
        try {
            const separator=/\s+eq(?:\s+|$)/.exec(text), expression=separator?text.slice(0,separator.index).trim():text, target=separator?text.slice(separator.index+separator[0].length).trim():null;
            const result=engine.evaluate(expression,$('angle-mode').value==='1'?'deg':'rad');
            const requested=target!==null?engine.requestedConversion(result,target):null;
            currentResult=result; currentLatex=result.latex; $('calculator-error').textContent=''; panel.hidden=false; $('expression-preview').hidden=false; renderMath($('expression-preview'),result.latex);
            $('input-prefixes').hidden=!result.usedPrefixes.length;
            if(result.usedPrefixes.length) renderMath($('input-prefixes'),result.usedPrefixes.map(p=>`\\mathrm{${['µ','mu','u'].includes(p.symbol)?'\\mu':p.symbol}}:\\;\\times 10^{${p.power}}`).join(',\\quad '));
            $('dimension-tag').textContent=engine.dimensionName(result.dim);
            resultChoices=engine.conversions(result); if(requested) resultChoices.unshift(requested); $('conversion-section').hidden=!resultChoices.length;
            if(requested) selectedUnit=requested.key;
            else if(!manualUnit || !resultChoices.some(row=>row.key===selectedUnit)) selectedUnit=engine.chooseDefault(result,expression,resultChoices);
            if(resultChoices.length) {filterResultUnits(); showResultChoice();}
            else { const unit=siUnit(result.dim), tex=`${complexNumber(result.value,result.imag)}${unit==='1'?'':`\\,${mathUnit(unit)}`}`; renderMath($('calculator-result'),tex); renderMath($('mobile-result-value'),tex); $('result-relation').hidden=true; $('result-prefix').hidden=true; }
            $('mobile-result').hidden=false;
            $('temperature-note').hidden=engine.dimensionName(result.dim)!=='temperature';
            $('constant-section').hidden=!result.used.length; const constants=$('constant-list'); constants.replaceChildren();
            result.used.forEach(key=>{
                const c=engine.constants[key], el=document.createElement('div'), label=document.createElement('span'), math=document.createElement('span'), source=document.createElement('small');
                label.textContent=`${c.name}: `; source.textContent=` — ${c.source}`;
                el.append(label,math,source); constants.append(el);
                const value=String(c.sourceValue ?? c.value);
                renderMath(math,`${c.latex} = ${mathNumber(value)}${c.unit?`\\,${mathUnit(c.unit)}`:''}`);
            });
        } catch(err) {currentResult=null; currentLatex=''; panel.hidden=true; $('calculator-error').textContent=err.message; $('expression-preview').hidden=true; $('input-prefixes').hidden=true; invalidate($('expression-preview'));}
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
            symbol.className=item.type==='unit'?'unit-color':item.type==='function'?'function-color':'constant-color'; symbol.textContent=item.symbol; description.textContent=`${item.name} · ${item.type}`;
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
        engine.searchItems(data,search).forEach(x=>{const b=document.createElement('button'); b.type='button'; b.className='menu-option'; const sym=document.createElement('strong'),name=document.createElement('span'); sym.className=menuMode==='units'?'unit-color':menuMode==='functions'&&Object.hasOwn(engine.functions,x.symbol)?'function-color':'constant-color'; sym.textContent=x.symbol; name.textContent=x.name; b.append(sym,name); b.addEventListener('click',()=>insert(x.symbol)); list.append(b);});
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
    $('clear-expression').addEventListener('mousedown',e=>e.preventDefault());
    $('clear-expression').addEventListener('click',()=>{input.value=''; manualUnit=false; $('result-unit-search').value=''; closeMenu(); hideSuggestions(); update(); input.focus();});
    input.addEventListener('scroll',()=>{$('expression-highlight').scrollLeft=input.scrollLeft;});
    $('angle-mode').addEventListener('input',()=>{$('angle-label').textContent=$('angle-mode').value==='1'?'Degrees':'Radians'; update();});
    input.addEventListener('click',showSuggestions);
    // Keep suggestions in place until a click completes: removing them on blur
    // can move a saved calculation out from under the pointer before click.
    document.addEventListener('click',e=>{if(e.target!==input && !$('autocomplete-list').contains(e.target)) hideSuggestions();});
    input.addEventListener('keydown',e=>{
        if($('autocomplete-list').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
        if(e.key==='ArrowDown'||e.key==='ArrowUp') {e.preventDefault(); suggestionIndex=(suggestionIndex+(e.key==='ArrowDown'?1:-1)+suggestions.length)%suggestions.length; markSuggestion();}
        else if(e.key==='Enter'||e.key==='Tab') {e.preventDefault(); acceptSuggestion(suggestionIndex);}
        else if(e.key==='Escape') {e.preventDefault(); hideSuggestions();}
    });
    $('result-unit-search').addEventListener('input',filterResultUnits);
    $('result-unit-search').addEventListener('keydown',e=>{if(e.key==='Enter' && !$('result-unit').hidden){e.preventDefault();selectedUnit=$('result-unit').options[0].value;$('result-unit').value=selectedUnit;manualUnit=true;showResultChoice();}});
    $('result-unit').addEventListener('change',()=>{selectedUnit=$('result-unit').value; manualUnit=true; showResultChoice();});
    for(const [id,mode] of [['constants-button','constants'],['units-button','units'],['functions-button','functions']]) {$(id).addEventListener('mousedown',e=>e.preventDefault()); $(id).addEventListener('click',()=>{if(!$('insert-menu').hidden && menuMode===mode) closeMenu(); else openMenu(mode);});}
    $('menu-search').addEventListener('input',populateMenu); $('unit-group').addEventListener('change',populateMenu); $('menu-close').addEventListener('click',()=>{closeMenu();input.focus();});
    $('menu-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault(); $('menu-items').querySelector('button')?.click();}});
    document.addEventListener('pointerdown',e=>{if(!$('insert-menu').hidden && !$('insert-menu').contains(e.target) && !e.target.closest('#constants-button, #units-button, #functions-button')) closeMenu();});
    $('copy-latex').addEventListener('click',async()=>{
        const status=$('action-status'); if(!currentLatex) {status.textContent='Enter a valid expression first.'; return;}
        let latex=currentLatex.replace(/\\color\{[^{}]*\}/g,'').trim();
        while(latex.startsWith('{') && latex.endsWith('}')) {
            let depth=0, enclosesAll=true;
            for(let i=0;i<latex.length;i++) {if(latex[i]==='\\') {i++; continue;} if(latex[i]==='{') depth++; else if(latex[i]==='}') depth--; if(depth===0 && i<latex.length-1) {enclosesAll=false; break;}}
            if(!enclosesAll || depth!==0) break;
            latex=latex.slice(1,-1).trim();
        }
        try {await navigator.clipboard.writeText(latex); status.textContent='LaTeX copied.';} catch {status.textContent='Could not copy LaTeX. Check clipboard permissions.';}
    });
    function savedResult(item) {
        const separator=/\s+eq(?:\s+|$)/.exec(item.expression);
        const expression=separator?item.expression.slice(0,separator.index).trim():item.expression;
        const result=item.result || engine.evaluate(expression,item.angle==='deg'?'deg':'rad');
        const choices=engine.conversions(result);
        let choice=choices.find(row=>row.key===item.unit);
        if(item.unit?.startsWith('eq:')) choice=engine.requestedConversion(result,item.unit.slice(3));
        if(!choice && choices.length) choice=choices.find(row=>row.key===engine.chooseDefault(result,expression,choices));
        const scaled=choice?engine.scaledChoice(choice):{value:result.value,imag:result.imag||0,label:siUnit(result.dim)};
        const tex=`${complexNumber(scaled.value,scaled.imag)}${scaled.label==='1'?'':`\\,\\color{teal}{${mathUnit(scaled.label)}}`}`;
        const number=value=>String(value).replace(/e([+-]?\d+)/,'E$1');
        const value=scaled.imag?`(${number(scaled.value)} + (${number(scaled.imag)}) * i)`:number(scaled.value);
        let unit=scaled.label.replace('Δ°C','deltaC').replace('Δ°F','deltaF').replace('°C','degC').replace('°F','degF').replaceAll('²','^2').replaceAll('³','^3').replaceAll('rad/s','rad_s');
        if(choice?.group==='Energy equivalent') unit=choice.key==='nm_energy'||choice.key==='eq:nm'||choice.key==='eq:nm_energy'?'nm_energy':unit+'_energy';
        return {tex,expression:unit==='1'?value:`${value} ${unit}`};
    }
    function renderSaved() {
        const list=$('saved-list'), entries=readStorage(savedKey,[]); list.replaceChildren();
        if(!Array.isArray(entries)||!entries.length) {list.textContent='No saved calculations yet.'; return;}
        entries.forEach((item,index)=>{const row=document.createElement('div'), restore=document.createElement('button'), formula=document.createElement('span'), resultDisplay=document.createElement('span'), useResult=document.createElement('button'), remove=document.createElement('button'); row.className='saved-row'; restore.type=useResult.type=remove.type='button'; restore.className='secondary saved-restore'; useResult.className=remove.className='secondary'; formula.textContent=item.expression; restore.setAttribute('aria-label',`Restore ${item.expression}`); useResult.textContent='Use result'; remove.textContent='Delete'; remove.setAttribute('aria-label',`Delete ${item.expression}`); restore.append(formula,resultDisplay);
            restore.addEventListener('click',()=>{ input.value=item.expression; $('angle-mode').value=item.angle==='deg'?'1':'0'; $('angle-label').textContent=item.angle==='deg'?'Degrees':'Radians'; selectedUnit=item.unit||''; manualUnit=!!selectedUnit; $('result-unit-search').value=''; update(); input.focus();});
            remove.addEventListener('click',()=>{entries.splice(index,1); if(!writeStorage(savedKey,entries)) $('action-status').textContent='Could not update browser storage.'; renderSaved();}); row.append(restore,useResult,remove); list.append(row);
            try {
                const match=/\s+eq\s+([A-Za-z0-9µ_/*^().\-\s]+)$/.exec(item.expression);
                const expression=match?item.expression.slice(0,match.index):item.expression;
                const suffix=match?`\\;\\mathrm{eq}\\;\\mathrm{${match[1].replaceAll('_','\\_').replace(/\s+/g,'\\,')}}`:'';
                renderMath(formula,engine.formatExpression(expression)+suffix);
            } catch { /* Keep the original text for entries that cannot be parsed. */ }
            try {
                const saved=savedResult(item); resultDisplay.className='saved-result'; renderMath(resultDisplay,`= ${saved.tex}`);
                useResult.setAttribute('aria-label',`Use result of ${item.expression}`);
                useResult.addEventListener('click',()=>{input.value=saved.expression; manualUnit=false; $('result-unit-search').value=''; update(); input.focus();});
            } catch {useResult.hidden=true; resultDisplay.textContent='Result unavailable'; resultDisplay.className='saved-result';}
        });
    }
    $('save-calculation').addEventListener('click',()=>{if(!currentLatex) {$('action-status').textContent='Enter a valid expression first.'; return;} const entries=readStorage(savedKey,[]); if(!Array.isArray(entries)) return; entries.unshift({expression:input.value,angle:$('angle-mode').value==='1'?'deg':'rad',unit:selectedUnit,result:currentResult}); $('action-status').textContent=writeStorage(savedKey,entries)?'Calculation saved.':'Could not save in browser storage.'; renderSaved();});
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&['k','e','y'].includes(e.key.toLowerCase())) {e.preventDefault();openMenu({k:'constants',e:'units',y:'functions'}[e.key.toLowerCase()]);} else if(e.key==='Escape'&&!$('insert-menu').hidden){closeMenu();input.focus();}});
    ['hbar * 10 GHz','7/8','1E6 eV','20 degC - 10 degC','2 kg * 9.81 m / s^2','10 GHz_energy'].forEach(example=>{const b=document.createElement('button');b.type='button';b.className='example-button';b.textContent=example;b.addEventListener('click',()=>{input.value=example;input.focus();manualUnit=false;$('result-unit-search').value='';update();});$('examples').append(b);});
    $('expression-highlight').parentElement.classList.add('syntax-active');
    renderSaved();
    highlightExpression();
})();
