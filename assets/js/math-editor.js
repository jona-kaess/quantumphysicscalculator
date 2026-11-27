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
            return `\\operatorname{${node.name}}\\left(${args.join(',')}\\right)`;
        }
        if(node.kind==='/') return `\\frac{${nodeLatex(node.left)}}{${nodeLatex(node.right)}}`;
        if(node.kind==='^') return `{${nodeLatex(node.left)}}^{${nodeLatex(node.right)}}`;
        return nodeLatex(node.left)+(node.kind==='*'?(node.implicit?'\\,':'\\cdot '):node.kind)+nodeLatex(node.right);
    }
    function toLatex(source) {
        if(!source.trim()) return '';
        const eq=/\s+eq(?:\s+|$)/.exec(source);
        if(eq) return nodeLatex(engine.parse(source.slice(0,eq.index)).tree)+'\\;\\operatorname{eq}\\;'+toLatex(source.slice(eq.index+eq[0].length));
        try {return nodeLatex(engine.parse(source).tree);}
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
            if(c==='{') return '('+read('}')+')';
            if(c==='^') return '^('+group()+')';
            if(c==='_') return '_'+group().replace(/[()\s]/g,'');
            if(c!=='\\') return ({'−':'-','×':'*','÷':'/','⁄':'/','ℏ':'hbar','π':'pi','α':'alpha','µ':'mu'})[c]||c;
            const match=latex.slice(pos).match(/^[A-Za-z]+/);
            if(!match) {const escaped=latex[pos++]||'';return [',',';',':',' ','!'].includes(escaped)?(escaped==='!'?'':' '):escaped;}
            const command=match[0];pos+=command.length;
            // A following space only terminates the LaTeX command.
            if(latex[pos]===' ') pos++;
            if(symbols.has(command)) return symbols.get(command);
            if(['left','right','mleft','mright','big','Big','bigl','bigr','displaystyle','textstyle'].includes(command)) {if(latex[pos]==='.')pos++;return '';}
            if(['frac','dfrac','tfrac'].includes(command)) {const numerator=group(),denominator=group();return `frac(${numerator},${denominator})`;}
            if(command==='sqrt') {if(latex[pos]==='[')throw Error('Use a power for roots other than square roots.');return 'sqrt('+group()+')';}
            if(['mathrm','mathit','mathbf','mathsf','mathtt','operatorname','text','textnormal','mbox'].includes(command)) return group();
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
        return read().trim();
    }
    function attach(input,field,onKeyboardChange) {
        if(!field || !rootAvailable()) return null;
        let source=input.value, syncing=false, captured=null;
        window.mathVirtualKeyboard.layouts=[{
            label:'123',tooltip:'Calculator',rows:[
                ['7','8','9',{latex:'\\frac{#0}{#?}'},{latex:'\\sqrt{#0}'},'[backspace]'],
                ['4','5','6','\\times',{label:'xⁿ',insert:'^{#?}'},'('],
                ['1','2','3','-','\\pi',')'],
                ['0','.','+',{latex:'\\times10^{#?}'},'[left]','[right]']
            ]
        },'alphabetic'];
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
        field.onInlineShortcut=(_field,word)=>{
            if(word.length>1 && engine.constants[word]) return symbolLatex(word,'C');
            return '';
        };
        field.onScrollIntoView=()=>{field.scrollIntoView({block:'nearest',inline:'nearest'});};
        input.hidden=true;
        field.hidden=false;
        input.parentElement.classList.add('math-mode');
        input.focus=()=>field.focus();
        input.blur=()=>{field.blur();window.mathVirtualKeyboard?.hide();};
        function readField(event) {
            if(syncing)return;
            if(!event?.inputType?.startsWith('history')) {
                const prefix=field.getValue(0,field.position,'latex');
                const word=prefix.match(/(?:^|[^\\A-Za-z])([A-Za-z][A-Za-z0-9_]*)$/)?.[1];
                if(word?.length>1 && engine.constants[word]) {
                    syncing=true;
                    field.selection={ranges:[[field.position-word.length,field.position]],direction:'forward'};
                    field.insert(symbolLatex(word,'C'),{format:'latex',selectionMode:'after',silenceNotifications:true});
                    syncing=false;
                }
            }
            field.dataset.incomplete=String(/\\placeholder(?:\{|\[)/.test(field.value));
            try {source=fromLatex(field.getValue('latex'));field.dataset.parseError='';}
            catch(error) {source='';field.dataset.parseError=error.message;}
            input.value=source;
            input.setSelectionRange(source.length,source.length);
            input.dispatchEvent(new Event('input',{bubbles:true}));
        }
        field.addEventListener('input',readField);
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
            field.setValue(toLatex(source),{silenceNotifications:true,selectionMode:'after'});
            field.dataset.incomplete=String(/\\placeholder(?:\{|\[)/.test(field.value));
            field.dataset.parseError='';syncing=false;
        }
        function completions() {
            if(!field.hasFocus())return {items:[]};
            const before=field.getValue(0,field.position,'latex');
            let start=field.position,end=field.position,word='';
            while(start>0) {const letter=field.getValue(start-1,start,'latex');if(!/^[A-Za-z0-9µ_]$/.test(letter))break;word=letter+word;start--;}
            while(end<field.lastOffset) {if(!/^[A-Za-z0-9µ_]$/.test(field.getValue(end,end+1,'latex')))break;end++;}
            const prefix=fromLatex(before);
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
            else if(item.type==='function')tex=`\\operatorname{${item.symbol}}\\left(${argument}${['mod','pow'].includes(item.symbol)?',#?':''}\\right)`;
            else tex=item.symbol==='euler'?'\\operatorname{euler}':item.symbol;
            field.insert(tex,{format:'latex',selectionMode:'placeholder',focus:true});captured=null;readField();
        }
        function key(button) {
            field.focus();
            if(button.dataset.command)field.executeCommand(button.dataset.command);
            else if(button.dataset.move)field.executeCommand(button.dataset.move==='-1'?'moveToPreviousChar':'moveToNextChar');
            else {
                const key=button.dataset.insert;
                const prefix=fromLatex(field.getValue(0,field.position,'latex'));
                const emptyNumerator=!prefix.trim() || /[+\-*/(,]$/.test(prefix.trim());
                const tex=key==='/'?(emptyNumerator?'\\frac{#?}{#?}':'\\frac{#@}{#?}'):key==='^'?'^{#?}':key==='*'?'\\cdot ':key;
                field.insert(tex,{format:'latex',selectionMode:'placeholder',focus:true});
            }
            readField();
        }
        field.setValue(toLatex(source),{silenceNotifications:true});
        return {field,sync,completions,insertItem,key,hasFocus:()=>field.hasFocus(),capture:()=>{captured=field.selection;},read:readField};
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
