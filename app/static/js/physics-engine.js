/* Safe arithmetic parser with SI dimensions. No evaluation of JavaScript input. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory(require('./scipy-constants.js'));
    else root.PhysicsEngine = factory(root.ScipyConstants);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (scipyConstants) {
    'use strict';
    const H=6.62607015e-34, HBAR=H/(2*Math.PI), KB=1.380649e-23, C=299792458, E=1.602176634e-19, MUB=9.2740100783e-24;
    const D={scalar:[0,0,0,0,0,0,0], length:[1,0,0,0,0,0,0], mass:[0,1,0,0,0,0,0], time:[0,0,1,0,0,0,0], current:[0,0,0,1,0,0,0], temperature:[0,0,0,0,1,0,0], amount:[0,0,0,0,0,1,0], luminous:[0,0,0,0,0,0,1], frequency:[0,0,-1,0,0,0,0], velocity:[1,0,-1,0,0,0,0], acceleration:[1,0,-2,0,0,0,0], force:[1,1,-2,0,0,0,0], energy:[2,1,-2,0,0,0,0], power:[2,1,-3,0,0,0,0], pressure:[-1,1,-2,0,0,0,0], charge:[0,0,1,1,0,0,0], voltage:[2,1,-3,-1,0,0,0], resistance:[2,1,-3,-2,0,0,0], magnetic:[0,1,-2,-1,0,0,0]};
    const U={};
    function unit(symbol,name,group,factor,dim,extra={}) { U[symbol]={symbol,name,group,factor,dim:D[dim],...extra}; }
    unit('m','metre','Length',1,'length'); unit('s','second','Time',1,'time'); unit('kg','kilogram','Mass',1,'mass'); unit('g','gram','Mass',1e-3,'mass'); unit('A','ampere','Current',1,'current'); unit('K','kelvin','Temperature',1,'temperature'); unit('mol','mole','Amount',1,'amount'); unit('cd','candela','Luminous intensity',1,'luminous');
    unit('Hz','hertz','Frequency',1,'frequency'); unit('rad_s','radian per second','Angular frequency',1,'frequency'); unit('N','newton','Force',1,'force'); unit('J','joule','Energy',1,'energy'); unit('eV','electronvolt','Energy',E,'energy'); unit('W','watt','Power',1,'power'); unit('Pa','pascal','Pressure',1,'pressure'); unit('C','coulomb','Charge',1,'charge'); unit('V','volt','Voltage',1,'voltage'); unit('ohm','ohm','Resistance',1,'resistance'); unit('T','tesla','Magnetic field',1,'magnetic');
    unit('min','minute','Time',60,'time'); unit('hr','hour','Time',3600,'time'); unit('L','litre','Volume',1e-3,'length',{dim:[3,0,0,0,0,0,0]});
    unit('l','litre','Volume',1e-3,'length',{dim:[3,0,0,0,0,0,0]});
    unit('F','farad','Capacitance',1,'scalar',{dim:[-2,-1,4,2,0,0,0]}); unit('H','henry','Inductance',1,'scalar',{dim:[2,1,-2,-2,0,0,0]}); unit('S','siemens','Conductance',1,'scalar',{dim:[-2,-1,3,2,0,0,0]}); unit('Wb','weber','Magnetic flux',1,'scalar',{dim:[2,1,-2,-1,0,0,0]});
    unit('G','gauss','Magnetic field',1e-4,'magnetic'); unit('gauss','gauss','Magnetic field',1e-4,'magnetic'); unit('cal','calorie (thermochemical)','Energy',4.184,'energy'); unit('kcal','kilocalorie (thermochemical)','Energy',4184,'energy'); unit('Wh','watt-hour','Energy',3600,'energy'); unit('kWh','kilowatt-hour','Energy',3.6e6,'energy');
    unit('bar','bar','Pressure',1e5,'pressure'); unit('atm','standard atmosphere','Pressure',101325,'pressure'); unit('torr','torr','Pressure',101325/760,'pressure'); unit('psi','pound-force per square inch','Pressure',6894.757293168,'pressure');
    unit('in','inch','Length',0.0254,'length'); unit('ft','foot','Length',0.3048,'length'); unit('yd','yard','Length',0.9144,'length'); unit('mi','mile','Length',1609.344,'length'); unit('angstrom','ångström','Length',1e-10,'length');
    unit('day','day','Time',86400,'time'); unit('lb','pound','Mass',0.45359237,'mass'); unit('oz','ounce','Mass',0.028349523125,'mass'); unit('tonne','metric tonne','Mass',1000,'mass');
    unit('rad','radian','Angle',1,'scalar'); unit('sr','steradian','Solid angle',1,'scalar'); unit('deg','degree','Angle',Math.PI/180,'scalar'); unit('rpm','revolutions per minute','Frequency',1/60,'frequency');
    unit('Bq','becquerel','Radioactivity',1,'frequency'); unit('Gy','gray','Absorbed dose',1,'scalar',{dim:[2,0,-2,0,0,0,0]}); unit('Sv','sievert','Equivalent dose',1,'scalar',{dim:[2,0,-2,0,0,0,0]}); unit('lm','lumen','Luminous flux',1,'luminous'); unit('lx','lux','Illuminance',1,'scalar',{dim:[-2,0,0,0,0,0,1]}); unit('kat','katal','Catalytic activity',1,'scalar',{dim:[0,0,-1,0,0,1,0]});
    unit('degC','degree Celsius','Absolute temperature',1,'temperature',{offset:273.15,absolute:true}); unit('degF','degree Fahrenheit','Absolute temperature',5/9,'temperature',{offset:459.67,absolute:true}); unit('deltaC','degree Celsius difference','Temperature difference',1,'temperature'); unit('deltaF','degree Fahrenheit difference','Temperature difference',5/9,'temperature');
    unit('nm_energy','nanometres via E = hc/λ','Energy equivalent',1,'energy',{wavelength:true});
    unit('Hz_energy','hertz via E = hν','Energy equivalent',H,'energy'); unit('rad_s_energy','rad/s via E = ħω','Energy equivalent',HBAR,'energy'); unit('K_energy','kelvin via E = kBT','Energy equivalent',KB,'energy'); unit('T_energy','tesla via E = μBB','Energy equivalent',MUB,'energy');
    U.eV.constants=['e']; U.Hz_energy.constants=['h']; U.rad_s_energy.constants=['hbar']; U.K_energy.constants=['k_B']; U.T_energy.constants=['mu_B']; U.nm_energy.constants=['h','c'];
    const prefixes={Q:1e30,R:1e27,Y:1e24,Z:1e21,E:1e18,P:1e15,T:1e12,G:1e9,M:1e6,k:1e3,h:1e2,da:1e1,d:1e-1,c:1e-2,m:1e-3,u:1e-6,mu:1e-6,µ:1e-6,n:1e-9,p:1e-12,f:1e-15,a:1e-18,z:1e-21,y:1e-24,r:1e-27,q:1e-30};
    for (const base of ['m','s','g','Hz','J','eV','W','Pa','A','V','N','T','C','K','L','l','mol','cd','F','H','S','Wb','Bq','Gy','Sv','lm','lx','kat','cal','rad_s','Hz_energy','rad_s_energy','K_energy','T_energy']) for(const [p,f] of Object.entries(prefixes)) {
        const key=p+base; if (!U[key]) U[key]={...U[base],symbol:key,name:p+U[base].name,factor:U[base].factor*f};
    }
    const constants={h:{name:'Planck constant',value:H,dim:[2,1,-1,0,0,0,0],unit:'J s',latex:'h'},hbar:{name:'Reduced Planck constant',value:HBAR,dim:[2,1,-1,0,0,0,0],unit:'J s',latex:'\\hbar'},k_B:{name:'Boltzmann constant',value:KB,dim:[2,1,-2,0,-1,0,0],unit:'J/K',latex:'k_B'},e:{name:'Elementary charge',value:E,dim:D.charge,unit:'C',latex:'e'},c:{name:'Speed of light in vacuum',value:C,dim:D.velocity,unit:'m/s',latex:'c'},mu_B:{name:'Bohr magneton',value:MUB,dim:[2,0,0,1,0,0,0],unit:'J/T',latex:'\\mu_B'},N_A:{name:'Avogadro constant',value:6.02214076e23,dim:[0,0,0,0,0,-1,0],unit:'1/mol',latex:'N_A'},pi:{name:'Pi',value:Math.PI,dim:D.scalar,unit:'',latex:'\\pi'}};
    for(const [symbol, entry] of Object.entries(scipyConstants || {})) constants[symbol]={...entry,latex:`\\mathrm{${symbol.replaceAll('_','\\_')}}`};
    for(const [symbol,constant] of Object.entries(constants)) if(!constant.source) constant.source=symbol==='pi'?'Mathematical constant':'SciPy 1.14.1 / CODATA 2018';
    const same=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-10);
    const scalar=d=>same(d,D.scalar);
    function tokenize(text) {
        const result=[]; let i=0;
        while(i<text.length) {
            if (/\s/.test(text[i])) { i++; continue; }
            const rest=text.slice(i), num=rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:E[+-]?\d+)?/), ident=rest.match(/^[A-Za-zµ_][A-Za-z0-9µ_]*/);
            if(num) { result.push({type:'number',value:num[0]}); i+=num[0].length; continue; }
            if(ident) { result.push({type:'name',value:ident[0]}); i+=ident[0].length; continue; }
            if('+-*/^()'.includes(text[i])) {result.push({type:text[i],value:text[i++]}); continue;}
            throw Error(`Unexpected character “${text[i]}”.`);
        }
        return result;
    }
    function parse(text) {
        const tokens=tokenize(text); let pos=0; const used=new Set();
        const peek=()=>tokens[pos], take=()=>tokens[pos++];
        function primary() {
            const t=take(); if(!t) throw Error('Expression is incomplete.');
            if(t.type==='number') return {kind:'number',text:t.value};
            if(t.type==='name') {if(!U[t.value]&&!constants[t.value]) throw Error(`Unknown symbol “${t.value}”. Use uppercase E for scientific notation.`); if(constants[t.value]) used.add(t.value); for(const key of U[t.value]?.constants||[]) used.add(key); return {kind:U[t.value]?'unit':'constant',text:t.value};}
            if(t.type==='(') {const node=add(); if(!peek()||take().type!==')') throw Error('Missing closing parenthesis.'); return {kind:'group',child:node};}
            throw Error(`Expected a number, unit, constant or parenthesis.`);
        }
        function power() { let n=primary(); if(peek()?.type==='^') {take(); n={kind:'^',left:n,right:unary()};} return n; }
        function unary() {if(peek()?.type==='-'||peek()?.type==='+') {const op=take().type; return {kind:'unary',op,child:unary()};} return power();}
        function multiply() {let n=unary(); while(peek() && (['*','/','number','name','('].includes(peek().type))) {const implicit=['number','name','('].includes(peek().type); const op=implicit?'*':take().type; n={kind:op,left:n,right:unary(),implicit};} return n;}
        function add() {let n=multiply(); while(peek() && ['+','-'].includes(peek().type)) {const op=take().type;n={kind:op,left:n,right:multiply()};}return n;}
        if(!tokens.length) throw Error('Enter an expression to get started.'); const tree=add(); if(pos<tokens.length) throw Error('Unexpected closing parenthesis.'); return {tree,used:[...used]};
    }
    function evaluateNode(n) {
        if(n.kind==='number') return {value:Number(n.text),dim:D.scalar};
        if(n.kind==='unit') {const u=U[n.text]; return {value:u.factor,dim:u.dim,unit:n.text,absoluteUnit:!!u.absolute,wavelengthUnit:!!u.wavelength,temperatureDifference:n.text==='deltaC'||n.text==='deltaF'};}
        if(n.kind==='constant') {const c=constants[n.text]; return {value:c.value,dim:c.dim};}
        if(n.kind==='group') return evaluateNode(n.child);
        if(n.kind==='unary') {const a=evaluateNode(n.child); if(a.absolute) throw Error('An absolute temperature cannot be negated.'); return {...a,value:n.op==='-'?-a.value:a.value};}
        const a=evaluateNode(n.left), b=evaluateNode(n.right);
        if(n.kind==='+'||n.kind==='-') {
            if(!same(a.dim,b.dim)) throw Error('Cannot add or subtract quantities with different dimensions.');
            if(a.absolute && b.absolute && n.kind==='+') throw Error('Two absolute temperatures cannot be added.');
            if(!a.absolute && b.absolute && n.kind==='-') throw Error('Cannot subtract an absolute temperature from a difference.');
            return {value:n.kind==='+'?a.value+b.value:a.value-b.value,dim:a.dim,absolute:a.absolute&&b.absolute?false:(a.absolute||b.absolute),temperatureDifference:!!(a.absolute&&b.absolute || a.temperatureDifference||b.temperatureDifference) && !(a.absolute!==b.absolute && (a.absolute||b.absolute))};
        }
        if(n.kind==='^') {if(a.absolute||a.absoluteUnit||!scalar(b.dim)||b.absolute) throw Error('A power must be dimensionless and cannot contain an absolute temperature.'); return {value:a.value**b.value,dim:a.dim.map(x=>x*b.value)};}
        if(n.kind==='*' && ((scalar(a.dim)&&b.absoluteUnit)||(scalar(b.dim)&&a.absoluteUnit))) {const number=scalar(a.dim)?a:b, u=U[(scalar(a.dim)?b:a).unit]; return {value:(number.value+u.offset)*u.factor,dim:u.dim,absolute:true};}
        if(n.kind==='*' && ((scalar(a.dim)&&b.wavelengthUnit)||(scalar(b.dim)&&a.wavelengthUnit))) {const number=scalar(a.dim)?a:b; if(number.value<=0) throw Error('Wavelength must be positive.'); return {value:H*C/(number.value*1e-9),dim:D.energy};}
        if(a.wavelengthUnit||b.wavelengthUnit) throw Error('Enter a positive value before nm_energy.');
        if(a.absolute||b.absolute||a.absoluteUnit||b.absoluteUnit) throw Error('Absolute Celsius and Fahrenheit values cannot be multiplied or divided. Use deltaC or deltaF for differences.');
        if(n.kind==='/' && b.value===0) throw Error('Division by zero.');
        return {value:n.kind==='*'?a.value*b.value:a.value/b.value,dim:a.dim.map((v,i)=>v+(n.kind==='*'?b.dim[i]:-b.dim[i])),temperatureDifference:!!(a.temperatureDifference&&scalar(b.dim)||b.temperatureDifference&&scalar(a.dim)&&n.kind==='*')};
    }
    function latex(n) {
        if(n.kind==='number') {const parts=n.text.split('E'); return parts.length===2?`${parts[0]}\\times 10^{${Number(parts[1])}}`:n.text;}
        if(n.kind==='unit') return `\\color{#087e8b}{\\mathrm{${n.text.replaceAll('_','\\_')}}}`;
        if(n.kind==='constant') return `\\color{#a14b9e}{${constants[n.text].latex}}`;
        if(n.kind==='group') return `\\left(${latex(n.child)}\\right)`;
        if(n.kind==='unary') return n.op+latex(n.child);
        if(n.kind==='/') return `\\frac{${latex(n.left)}}{${latex(n.right)}}`;
        if(n.kind==='^') return `{${latex(n.left)}}^{${latex(n.right)}}`;
        return `${latex(n.left)} ${n.kind==='*'?'\\cdot':n.kind} ${latex(n.right)}`;
    }
    function evaluate(text) {const parsed=parse(text), result=evaluateNode(parsed.tree); if(!Number.isFinite(result.value) || result.dim.some(x=>!Number.isFinite(x))) throw Error('Result is not finite.'); if(result.absoluteUnit||result.wavelengthUnit) throw Error('Enter a numerical value before this unit.'); if(result.absolute && result.value<0) throw Error('Absolute temperature cannot be below zero kelvin.'); return {...result,latex:latex(parsed.tree),used:parsed.used};}
    function dimensionName(dim) {return Object.entries(D).find(([,d])=>same(d,dim))?.[0]||'composite quantity';}
    function conversions(result) {
        const choices=Object.values(U).filter(u=>same(u.dim,result.dim) && !u.absolute && !u.symbol.includes('_energy') && !['deltaC','deltaF'].includes(u.symbol));
        // Show a concise set of common units, plus physically defined energy equivalences.
        const list=choices.filter(u=>!scalar(result.dim) && !u.symbol.startsWith('mu') && !u.symbol.startsWith('µ')).map(u=>({label:u.symbol,value:result.value/u.factor,group:u.group})).filter(u=>Number.isFinite(u.value));
        if(same(result.dim,D.velocity)) list.push({label:'m/s',value:result.value,group:'Velocity'},{label:'km/h',value:result.value*3.6,group:'Velocity'});
        if(same(result.dim,D.acceleration)) list.push({label:'m/s²',value:result.value,group:'Acceleration'});
        if(same(result.dim,D.temperature)) {if(!result.temperatureDifference) list.push({label:'°C',value:Math.abs(result.value-273.15)<1e-10?0:result.value-273.15,group:'Absolute temperature'},{label:'°F',value:Math.abs(result.value*9/5-459.67)<1e-10?0:result.value*9/5-459.67,group:'Absolute temperature'}); if(!result.absolute) list.push({label:'Δ°C',value:result.value,group:'Temperature difference'},{label:'Δ°F',value:result.value*9/5,group:'Temperature difference'});}
        if(same(result.dim,D.energy)) {for(const k of ['Hz_energy','rad_s_energy','K_energy','T_energy']) list.push({label:U[k].name,value:result.value/U[k].factor,group:'Energy equivalent'}); if(result.value>0) list.push({label:'nm via E = hc/λ',value:H*C/result.value*1e9,group:'Energy equivalent'});}
        return list;
    }
    function searchItems(items, query) {
        query=query.trim().toLowerCase();
        const rank=x=>{const s=x.symbol.toLowerCase(), n=x.name.toLowerCase(); return !query?0:s===query?0:n===query?1:s.startsWith(query)?2:n.startsWith(query)?3:4;};
        return items.filter(x=>`${x.symbol} ${x.name}`.toLowerCase().includes(query)).sort((a,b)=>rank(a)-rank(b));
    }
    function chooseDefault(result, text, choices) {
        const name=dimensionName(result.dim);
        const preferred={energy:/eV\b/.test(text)?'eV':'J',frequency:'Hz',length:'m',mass:'g',time:'s',temperature:'K',force:'N',power:'W',pressure:'Pa',charge:'C',voltage:'V',resistance:'ohm',magnetic:'T',current:'A',amount:'mol',luminous:'cd'}[name];
        if(!preferred) return choices[0]?.label || '';
        const prefixes=['','k','M','G','T','m','u','n','p','f','a','z','y','r','q'];
        const candidates=choices.filter(row=>prefixes.some(p=>row.label===p+preferred));
        return candidates.find(row=>Math.abs(row.value)>=1 && Math.abs(row.value)<1000)?.label || candidates.find(row=>row.label===preferred)?.label || choices[0]?.label || '';
    }
    return {units:U,constants,dimensions:D,parse,evaluate,conversions,dimensionName,searchItems,chooseDefault};
});
