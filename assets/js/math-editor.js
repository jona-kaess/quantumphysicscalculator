/* MathLive is the editor; PhysicsEngine remains the only calculation engine. */
(function(root,factory) {
    if(typeof module==='object' && module.exports) module.exports=factory(require('./physics-engine.js'));
    else root.PhysicsMath=factory(root.PhysicsEngine);
})(typeof globalThis!=='undefined'?globalThis:this,function(engine) {
    const macros={}, symbols=new Map(), names=new Map();
    const encode=symbol=>[...symbol].map(c=>{let n=c.codePointAt(0);return [676,26,1].map(divisor=>{const digit=Math.floor(n/divisor);n%=divisor;return String.fromCharCode(97+digit);}).join('');}).join('');
    function register(symbol,definition,kind) {
        const name='qpc'+kind+encode(symbol);
        macros[name]={def:`\\textcolor{${kind==='C'?'#d8b5ef':'#84dbce'}}{${definition}}`,captureSelection:true,expand:false};
        symbols.set(name,symbol); names.set(kind+symbol,name);
    }
    for(const [symbol,c] of Object.entries(engine.constants)) register(symbol,c.latex,'C');
    for(const [symbol,u] of Object.entries(engine.units)) {
        const special={ohm:'\\Omega',degC:'{}^\\circ\\mathrm{C}',degF:'{}^\\circ\\mathrm{F}',deltaC:'\\Delta{}^\\circ\\mathrm{C}',deltaF:'\\Delta{}^\\circ\\mathrm{F}'};
        const definition=special[symbol] || (['u','mu','µ'].includes(u.prefix)?`\\mu\\mathrm{${u.base.replaceAll('_','\\_')}}`:`\\mathrm{${symbol.replaceAll('_','\\_')}}`);
        register(symbol,definition,'U');
    }
    function symbolLatex(symbol,kind) {
        const name=names.get(kind+symbol);
        return name?'\\'+name+' ':symbol;
    }
    const functionNameLatex=name=>`\\textcolor{#efc18d}{\\operatorname{${name}}}`;
    const knownNames=[...Object.keys(engine.constants),...Object.keys(engine.units),...Object.keys(engine.functions),'eq','euler'];
    function nodeLatex(node) {
        if(node.kind==='constant') return symbolLatex(node.text,'C');
        if(node.kind==='unit') return symbolLatex(node.text,'U');
        if(node.kind==='number') {const [number,power]=node.text.split('E');return power===undefined?number:`${number}\\cdot10^{${power}}`;}
        if(node.kind==='imaginary') return '\\mathrm{i}';
        if(node.kind==='euler') return '\\operatorname{euler}';
        if(node.kind==='group') return `\\left(${nodeLatex(node.child)}\\right)`;
        if(node.kind==='unary') return node.op+nodeLatex(node.child);
        if(node.kind==='postfix') return nodeLatex(node.child)+(node.op==='%'?'\\%':'!');
        if(node.kind==='function') {
            const args=node.args.map(nodeLatex);
            if(node.name==='frac') return `\\frac{${args[0]}}{${args[1]}}`;
            if(node.name==='sqrt') return `\\sqrt{${args[0]}}`;
            return `${functionNameLatex(node.name)}\\left(${args.join(',')}\\right)`;
        }
        if(node.kind==='/') return `\\frac{${nodeLatex(node.left)}}{${nodeLatex(node.right)}}`;
        if(node.kind==='^') return `{${nodeLatex(node.left)}}^{${nodeLatex(node.right)}}`;
        return nodeLatex(node.left)+(node.kind==='*'?(node.implicit?'\\,':'\\cdot '):node.kind)+nodeLatex(node.right);
    }
    function toLatex(source,options={}) {
        if(!source.trim()) return '';
        const eq=/\s+eq(?:\s+|$)/.exec(source);
        if(eq) return toLatex(source.slice(0,eq.index),options)+'\\;\\operatorname{eq}\\;'+toLatex(source.slice(eq.index+eq[0].length),options);
        try {const latex=nodeLatex(engine.parse(source).tree);return options.decimalSeparator===','?latex.replace(/\.(?=\d)/g,'{,}'):latex;}
        catch {return source.replaceAll('\\','\\backslash ').replaceAll('*','\\cdot ').replaceAll('%','\\%');}
    }
    // Parse the editor's LaTeX into the calculator's existing, persistent syntax.
    // In particular, macros keep constants distinct from lookalike SI units.
    function fromLatex(latex) {
        let pos=0;
        const greek={hbar:'hbar',pi:'pi',alpha:'alpha',epsilon:'epsilon',varepsilon:'epsilon',mu:'mu',gamma:'gamma',lambda:'lambda',sigma:'sigma',Phi:'Phi',tau:'tau',nu:'nu',infty:'inf'};
        function group() {
            while(/\s/.test(latex[pos]||'') && pos<latex.length) pos++;
            if(latex[pos]==='{') {pos++;return read('}');}
            return token();
        }
        function token() {
            let c=latex[pos++];
            if(c===undefined) return '';
            if(c==='{') {if(latex.slice(pos,pos+2)===',}') {pos+=2;return '.';}return '('+read('}')+')';}
            if(c==='^') return '^('+group()+')';
            if(c==='_') return '_'+group().replace(/[()\s]/g,'');
            if(c!=='\\') return ({'−':'-','×':'*','÷':'/','⁄':'/','ℏ':'hbar','π':'pi','α':'alpha','µ':'mu',';':','})[c]||c;
            const match=latex.slice(pos).match(/^[A-Za-z]+/);
            if(!match) {const escaped=latex[pos++]||'';return [',',';',':',' ','!'].includes(escaped)?(escaped==='!'?'':' '):escaped;}
            const command=match[0];pos+=command.length;
            // A following space only terminates the LaTeX command.
            if(latex[pos]===' ') pos++;
            if(symbols.has(command)) return ' '+symbols.get(command)+' ';
            if(['left','right','mleft','mright','big','Big','bigl','bigr','displaystyle','textstyle'].includes(command)) {if(latex[pos]==='.')pos++;return '';}
            if(['frac','dfrac','tfrac'].includes(command)) {const numerator=group(),denominator=group();return `frac(${numerator},${denominator})`;}
            if(command==='sqrt') {if(latex[pos]==='[')throw Error('Use a power for roots other than square roots.');return 'sqrt('+group()+')';}
            if(['mathrm','mathit','mathbf','mathsf','mathtt','operatorname','text','textnormal','mbox'].includes(command)) {const value=group();return value==='eq'?' eq ':value;}
            if(['textcolor','colorbox','class','htmlClass','htmlData'].includes(command)) {group();return group();}
            if(command==='color') {group();return '';}
            if(command==='placeholder') {group();return '';}
            if(['cdot','times','ast'].includes(command)) return '*';
            if(command==='div') return '/';
            if(command==='quad'||command==='qquad') return ' ';
            if(command==='lparen') return '(';
            if(command==='rparen') return ')';
            if(command==='lbrack') return '(';
            if(command==='rbrack') return ')';
            if(command==='exponentialE') return 'euler';
            if(command==='imaginaryI') return 'i';
            if(command==='bar') return group()+'_bar';
            if(greek[command]) return greek[command];
            if(Object.hasOwn(engine.functions,command)) return command;
            throw Error(`Unsupported math command \\${command}.`);
        }
        function read(stop='') {
            let result='';
            while(pos<latex.length) {
                if(stop && latex[pos]===stop) {pos++;break;}
                if(/\s/.test(latex[pos])) {pos++;continue;}
                result+=token();
            }
            return result;
        }
        return read().replace(/\s+/g,' ').trim();
    }
    function attach(input,field,onKeyboardChange,options={}) {
        if(!field || !rootAvailable()) return null;
        let source=input.value, syncing=false, captured=null;
        let preferences=options;
        function configureKeyboard() {
            MathfieldElement.decimalSeparator=preferences.decimalSeparator || '.';
            window.mathVirtualKeyboard.alphabeticLayout=preferences.keyboardLayout || 'qwertz';
            window.mathVirtualKeyboard.layouts=[{
                label:'123',tooltip:'Calculator',rows:[
                    ['7','8','9',{latex:'\\frac{#?}{#?}',class:'qpc-fraction-key',command:['insert','\\frac{#@}{#?}',{selectionMode:'placeholder'}]},{latex:'\\sqrt{#0}'},'[backspace]'],
                    ['4','5','6',{latex:'\\cdot',class:'qpc-multiply-key'},{label:'xⁿ',class:'qpc-power-key',insert:'^{#?}'},'('],
                    ['1','2','3','-',{latex:'\\pi',insert:symbolLatex('pi','C')},')'],
                    ['0',{label:preferences.decimalSeparator || '.',class:'qpc-decimal-key',command:'insertDecimalSeparator'},'+',{latex:'\\times10^{#?}',class:'qpc-exponent-key'},'[left]','[right]'],
                    [{label:'ℏ',insert:symbolLatex('hbar','C')},{label:'eq',insert:'\\;\\operatorname{eq}\\;'}, {label:preferences.decimalSeparator===','?';':',',insert:','},{label:'⇥',class:'qpc-next-key',command:'moveToNextPlaceholder'},{label:'⌫',command:'deleteBackward'},'[hide-keyboard]']
                ]
            },'alphabetic'];
        }
        configureKeyboard();
        field.macros={...field.macros,...macros};
        field.inlineShortcuts={};
        field.inlineShortcutTimeout=0;
        field.mathModeSpace='\\;';
        field.smartMode=false;
        field.smartFence=true;
        field.smartSuperscript=false;
        field.popoverPolicy='off';
        field.menuItems=[];
        field.onExport=(_field,latex)=>'$$'+latex.replace(/\\([A-Za-z]+)/g,(command,name)=>symbols.has(name)?macros[name].def:command)+'$$';

        field.onScrollIntoView=()=>{field.scrollIntoView({block:'nearest',inline:'nearest'});};
        input.hidden=true;
        field.hidden=false;
        input.parentElement.classList.add('math-mode');
        input.focus=()=>field.focus();
        input.blur=()=>{field.blur();window.mathVirtualKeyboard?.hide();};
        function repairInputSelection() {
            const sink=field.shadowRoot?.activeElement;
            if(!sink?.isContentEditable)return;
            const selection=field.shadowRoot.getSelection?.() || document.getSelection();
            if(!selection || sink.contains(selection.anchorNode))return;
            // Modal focus restoration can leave the browser caret on a toolbar
            // button while MathLive's formula selection is still correct.
            const range=document.createRange();range.selectNodeContents(sink);
            if(field.selection.ranges.every(([start,end])=>start===end))range.collapse(false);
            selection.removeAllRanges();selection.addRange(range);
        }
        function atomLetter(start,end) {
            const latex=field.getValue(start,end,'latex');
            if(/\\qpc[CU]/.test(latex))return '';
            try {const text=fromLatex(latex);return /^[A-Za-z0-9µ_]$/.test(text)?text:'';} catch {return '';}
        }
        // Empty atoms at the current depth delimit arguments and fraction branches.
        function branchStart(end,limit=0) {
            const depth=field.getElementInfo(end)?.depth || 0;
            for(let start=end-1;start>=limit;start--) {
                const info=field.getElementInfo(start);
                if(info && info.depth<=depth && !info.latex)return start;
            }
            return limit;
        }
        function nameAtCaret() {
            const position=field.position,ends=[position];
            // Include a closing subscript/macro branch when its boundary is empty.
            const closing=position<field.lastOffset?field.getElementInfo(position+1)?.latex || '':'';
            if(!field.getValue(position,position+1,'latex') && /_|\\qpc/.test(closing) && !/\\(?:frac|sqrt|left)/.test(closing))ends.push(position+1);
            let candidate=null;
            for(const end of ends) {
                const first=branchStart(end,Math.max(0,end-80));
                for(let start=end-1;start>=first;start--) {
                    const latex=field.getValue(start,end,'latex');
                    if(/\\[;, :]/.test(latex))break;
                    let word;try {word=fromLatex(latex).replace(/\s/g,'');} catch {continue;}
                    if(/[+*/(),^=;\-]/.test(word))break;
                    if(!/^[A-Za-zµ][A-Za-z0-9µ_]*$/.test(word))continue;
                    if(/[A-Za-zµ_]/.test(start>0?atomLetter(start-1,start):''))continue;
                    candidate={start,end,word,latex};
                }
            }
            return candidate;
        }
        function normalizeName() {
            const range=nameAtCaret();
            if(!range)return;
            const {word,latex}=range;
            let tex;
            if(Object.hasOwn(engine.constants,word))tex=symbolLatex(word,'C');
            else if(Object.hasOwn(engine.units,word))tex=symbolLatex(word,'U');
            else if(word==='eq')tex='\\textcolor{#edf2f8}{eq}';
            else if(word==='euler')tex='\\operatorname{euler}';
            else if(Object.hasOwn(engine.functions,word)) {
                if(latex.includes('\\operatorname{'+word+'}'))return;
                tex=functionNameLatex(word);
            } else if(/\\qpc[CU]/.test(latex) && knownNames.some(name=>name.startsWith(word))) {
                // A complete symbol can be the beginning of a longer name:
                // G → GHz, m → mu_B, c → cos. Keep that continuation editable.
                tex='\\textcolor{#edf2f8}{'+word+'}';
            } else return;
            if(latex.trim()===tex.trim())return;
            field.selection={ranges:[[range.start,range.end]],direction:'forward'};
            field.insert(tex,{format:'latex',selectionMode:'after',silenceNotifications:true});
            field.applyStyle({color:'#edf2f8'},{operation:'set',silenceNotifications:true});
        }
        function readField(event) {
            if(syncing)return;
            syncing=true;
            try {if(!event?.inputType?.startsWith('history'))normalizeName();} finally {syncing=false;}
            field.dataset.incomplete=String(/\\placeholder(?:\{|\[)/.test(field.value));
            try {source=fromLatex(field.getValue('latex'));field.dataset.parseError='';}
            catch(error) {source='';field.dataset.parseError=error.message;}
            input.value=source;
            input.setSelectionRange(source.length,source.length);
            input.dispatchEvent(new Event('input',{bubbles:true}));
        }
        field.addEventListener('input',readField);
        // The on-screen field key must not tab into unrelated app controls.
        let nextFieldSelection=null,nextFieldTimer;
        document.addEventListener('pointerdown',event=>{
            if(!event.target.closest?.('.qpc-next-key'))return;
            nextFieldSelection=field.selection;
            clearTimeout(nextFieldTimer);
            nextFieldTimer=setTimeout(()=>{nextFieldSelection=null;},500);
        },true);
        field.addEventListener('move-out',event=>{
            if(!nextFieldSelection)return;
            event.preventDefault();
            let target=nextFieldSelection;
            for(let offset=0;offset<field.lastOffset;offset++) {
                const latex=field.getValue(offset,offset+1,'latex');
                if(latex.includes('\\placeholder') && !/\\(?:frac|sqrt|left)/.test(latex)) {target={ranges:[[offset,offset+1]],direction:'forward'};break;}
            }
            field.selection=target;
            nextFieldSelection=null;
        });

        const keyboardObserver=new ResizeObserver(onKeyboardChange);
        let observedKeyboard=null;
        function observeKeyboard() {
            requestAnimationFrame(()=>{
                const panel=document.querySelector('.MLK__backdrop');
                if(panel && panel!==observedKeyboard) {keyboardObserver.disconnect();keyboardObserver.observe(panel);observedKeyboard=panel;}
                onKeyboardChange();
            });
        }
        window.mathVirtualKeyboard?.addEventListener('geometrychange',observeKeyboard);
        const preferTouchKeyboard=window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints>0 || /Android|iPhone|iPad/.test(navigator.userAgent);
        field.addEventListener('focus',()=>{
            if(preferTouchKeyboard) window.mathVirtualKeyboard.show();
            observeKeyboard();
        });
        field.addEventListener('pointerdown',event=>{
            field.focus();
            if(preferTouchKeyboard || event.pointerType==='touch') window.mathVirtualKeyboard.show();
            observeKeyboard();
        });
        field.addEventListener('blur',()=>{window.mathVirtualKeyboard?.hide();onKeyboardChange();});
        function sync() {
            if(input.value===source)return;
            source=input.value;syncing=true;
            field.setValue(toLatex(source,preferences),{silenceNotifications:true,selectionMode:'after'});
            field.dataset.incomplete=String(/\\placeholder(?:\{|\[)/.test(field.value));
            field.dataset.parseError='';syncing=false;
        }
        function completions() {
            if(!field.hasFocus())return {items:[]};
            const before=field.getValue(0,field.position,'latex');
            const range=nameAtCaret();
            const {start=field.position,end=field.position,word=''}=range || {};
            let prefix='';try {prefix=fromLatex(before);} catch {return {items:[]};}
            if(!/^[A-Za-zµ][A-Za-z0-9µ_]*$/.test(word)) {
                if(/(?:^|\s)eq$/.test(prefix)) return {...engine.completions('eq ',3),mathStart:field.position,mathEnd:field.position};
                return {items:[]};
            }
            const context=/(?:^|\s)eq\s+\S*$/.test(prefix)?'eq '+word:word;
            return {...engine.completions(context,context.length),mathStart:start,mathEnd:end};
        }
        function insertItem(item,range) {
            if(range)field.selection={ranges:[[range.mathStart,range.mathEnd]],direction:'forward'};
            else if(captured)field.selection=captured;
            let tex;
            const argument=range?'#?':'#0';
            if(item.type==='constant' && engine.constants[item.symbol])tex=symbolLatex(item.symbol,'C');
            else if(item.type==='unit')tex=symbolLatex(item.symbol,'U');
            else if(item.type==='operator')tex='\\;\\operatorname{eq}\\;';
            else if(item.symbol==='sqrt')tex=`\\sqrt{${argument}}`;
            else if(item.symbol==='frac')tex=`\\frac{${argument}}{#?}`;
            else if(item.type==='function')tex=`${functionNameLatex(item.symbol)}\\left(${argument}${!item.typed && ['mod','pow'].includes(item.symbol)?',#?':''}\\right)`;
            else tex=item.symbol==='euler'?'\\operatorname{euler}':item.symbol;
            field.insert(tex,{format:'latex',selectionMode:'placeholder',focus:true});captured=null;readField();
        }
        function insertFraction() {
            if(field.selection.ranges.every(([start,end])=>start===end)) {
                const end=field.position;
                let start=end;
                function factor(node) {
                    if(node.kind==='*')return node.implicit && factor(node.left) && factor(node.right);
                    return ['number','constant','unit','imaginary','euler','group','function','unary','postfix','^'].includes(node.kind);
                }
                // Explicitly select the previous factor, including entire macro
                // branches and an adjacent coefficient. MathLive's #@ skips macros.
                const first=branchStart(end),depth=field.getElementInfo(end)?.depth || 0;
                for(let offset=end-1;offset>=first;offset--) {
                    const latex=field.getValue(offset,end,'latex');
                    try {if(field.getElementInfo(offset+1)?.depth<=depth && /^[+*/=,\-]$/.test(fromLatex(field.getValue(offset,offset+1,'latex'))))break;} catch {}
                    let tree;try {tree=engine.parse(fromLatex(latex)).tree;} catch {continue;}
                    if(factor(tree) && !/\\[;, :]/.test(field.getValue(offset,offset+1,'latex')))start=offset;
                }
                if(start<end)field.selection={ranges:[[start,end]],direction:'forward'};
            }
            const selected=field.selection.ranges.some(([start,end])=>start!==end);
            const numerator=selected?field.selection.ranges.map(([start,end])=>field.getValue(Math.min(start,end),Math.max(start,end),'latex')).join(''):'#?';
            field.insert('\\frac{'+numerator+'}{#?}',{format:'latex',selectionMode:'placeholder',focus:true});
            readField();
        }
        function closeFunction() {
            const original=field.selection;
            for(let level=0;level<20;level++) {
                const current=field.getElementInfo(field.position),next=field.getElementInfo(field.position+1);
                if(!next || !current || next.depth>=current.depth)break;
                if(/\\(?:sqrt|left\()/.test(next.latex)) {
                    field.executeCommand('moveAfterParent');readField();return true;
                }
                if(!/\\frac/.test(next.latex))break;
                field.executeCommand('moveAfterParent');
            }
            field.selection=original;return false;
        }
        field.addEventListener('beforeinput',event=>{
            if(syncing)return;
            if(event.data===')' && closeFunction())event.preventDefault();
            else if(event.data==='\\frac{#@}{#?}') {
                event.preventDefault();setTimeout(insertFraction,0);
            } else if(['(','\\left(\\right?','\\left(\\right)'].includes(event.data)) {
                const range=nameAtCaret();
                if(!range || range.word==='frac' || !Object.hasOwn(engine.functions,range.word))return;
                event.preventDefault();
                setTimeout(()=>insertItem({type:'function',symbol:range.word,typed:true},{mathStart:range.start,mathEnd:range.end}),0);
            }
        });
        field.addEventListener('keydown',event=>{
            if(event.isComposing || event.ctrlKey || event.metaKey || event.altKey)return;
            if(event.key.length===1)repairInputSelection();
            if(event.key===')' && closeFunction()) {event.preventDefault();event.stopImmediatePropagation();return;}
            if(event.key==='(') {
                const range=nameAtCaret();
                if(range && range.word!=='frac' && Object.hasOwn(engine.functions,range.word)) {
                    event.preventDefault();event.stopImmediatePropagation();
                    insertItem({type:'function',symbol:range.word,typed:true},{mathStart:range.start,mathEnd:range.end});return;
                }
            }
            if(['*','/',';'].includes(event.key)) {
                event.preventDefault();event.stopImmediatePropagation();
                if(event.key==='/')insertFraction();
                else {field.insert(event.key==='*'?'\\cdot ':',',{format:'latex',focus:true});readField();}
            }
        },true);
        field.setValue(toLatex(source,preferences),{silenceNotifications:true});
        function configure(next) {
            const original=field.value;
            let latex=original.replace(/\{,\}/g,'.');
            const keyboardChanged=preferences.decimalSeparator!==next.decimalSeparator || preferences.keyboardLayout!==next.keyboardLayout;
            preferences=next;
            if(keyboardChanged)configureKeyboard();
            if(preferences.decimalSeparator===',')latex=latex.replace(/\.(?=\d)/g,'{,}');
            if(latex===original)return;
            // A modal restores the keyboard sink asynchronously. Avoid replacing
            // its selection during that transfer, or overwriting newer edits.
            setTimeout(()=>{
                if(field.value!==original)return;
                const selection=field.selection;
                syncing=true;
                try {field.setValue(latex,{silenceNotifications:true});field.selection=selection;} finally {syncing=false;}
            },100);
        }
        return {field,sync,completions,insertItem,configure,hasFocus:()=>field.hasFocus(),capture:()=>{captured=field.selection;},read:readField};
    }
    function rootAvailable() {return typeof window!=='undefined' && !!window.MathfieldElement;}
    function keyboardHeight() {
        if(typeof window==='undefined' || !window.mathVirtualKeyboard?.visible)return 0;
        const panel=document.querySelector('.MLK__backdrop');
        if(!panel)return window.mathVirtualKeyboard.boundingRect.height;
        let top=panel.getBoundingClientRect().top;
        document.querySelectorAll('.MLK__layer.is-visible .MLK__toolbar').forEach(toolbar=>{
            const rect=toolbar.getBoundingClientRect();if(rect.width && rect.height)top=Math.min(top,rect.top);
        });
        const viewport=window.visualViewport;
        return Math.ceil((viewport?.offsetTop || 0)+(viewport?.height || window.innerHeight)-top);
    }
    return {toLatex,fromLatex,symbolLatex,macros,attach,keyboardHeight};
});
