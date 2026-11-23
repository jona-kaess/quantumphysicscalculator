/* Safe arithmetic parser with SI dimensions. No evaluation of JavaScript input. */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) module.exports = factory(require('./scipy-constants.js'));
    else root.PhysicsEngine = factory(root.ScipyConstants);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (scipyConstants) {
    'use strict';
    const H=6.62607015e-34, HBAR=H/(2*Math.PI), KB=1.380649e-23, C=299792458, E=1.602176634e-19, MUB=9.2740100783e-24;
    const D={scalar:[0,0,0,0,0,0,0], length:[1,0,0,0,0,0,0], mass:[0,1,0,0,0,0,0], time:[0,0,1,0,0,0,0], current:[0,0,0,1,0,0,0], temperature:[0,0,0,0,1,0,0], amount:[0,0,0,0,0,1,0], luminous:[0,0,0,0,0,0,1], frequency:[0,0,-1,0,0,0,0], velocity:[1,0,-1,0,0,0,0], acceleration:[1,0,-2,0,0,0,0], force:[1,1,-2,0,0,0,0], energy:[2,1,-2,0,0,0,0], power:[2,1,-3,0,0,0,0], pressure:[-1,1,-2,0,0,0,0], charge:[0,0,1,1,0,0,0], voltage:[2,1,-3,-1,0,0,0], resistance:[2,1,-3,-2,0,0,0], magnetic:[0,1,-2,-1,0,0,0]};
    Object.assign(D, {
        area:[2,0,0,0,0,0,0], volume:[3,0,0,0,0,0,0], wavenumber:[-1,0,0,0,0,0,0],
        momentum:[1,1,-1,0,0,0,0], 'action / angular momentum':[2,1,-1,0,0,0,0],
        capacitance:[-2,-1,4,2,0,0,0], inductance:[2,1,-2,-2,0,0,0], conductance:[-2,-1,3,2,0,0,0],
        'magnetic flux':[2,1,-2,-1,0,0,0], 'electric field strength':[1,1,-3,-1,0,0,0],
        'magnetic field strength':[-1,0,0,1,0,0,0], 'mass density':[-3,1,0,0,0,0,0],
        'charge density':[-3,0,1,1,0,0,0], 'surface charge density':[-2,0,1,1,0,0,0],
        'current density':[-2,0,0,1,0,0,0], 'energy density':[-1,1,-2,0,0,0,0],
        'power density':[0,1,-3,0,0,0,0], 'permittivity':[-3,-1,4,2,0,0,0],
        'permeability':[1,1,-2,-2,0,0,0], 'molar energy':[2,1,-2,0,0,-1,0],
        'specific heat capacity':[2,0,-2,0,-1,0,0]
    });
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
    unit('nmi','nautical mile','Length',1852,'length'); unit('furlong','furlong','Length',201.168,'length'); unit('mil','thousandth of an inch','Length',0.0000254,'length');
    unit('acre','acre','Area',4046.8564224,'area'); unit('sq_in','square inch','Area',0.00064516,'area'); unit('sq_ft','square foot','Area',0.09290304,'area'); unit('sq_yd','square yard','Area',0.83612736,'area'); unit('sq_mi','square mile','Area',2589988.110336,'area');
    unit('cu_in','cubic inch','Volume',0.000016387064,'volume'); unit('cu_ft','cubic foot','Volume',0.028316846592,'volume'); unit('cu_yd','cubic yard','Volume',0.764554857984,'volume');
    unit('gal_US','US liquid gallon','Volume',0.003785411784,'volume'); unit('qt_US','US liquid quart','Volume',0.003785411784/4,'volume'); unit('pt_US','US liquid pint','Volume',0.003785411784/8,'volume'); unit('cup_US','US customary cup','Volume',0.003785411784/16,'volume'); unit('fl_oz_US','US fluid ounce','Volume',0.003785411784/128,'volume'); unit('tbsp_US','US tablespoon','Volume',0.003785411784/256,'volume'); unit('tsp_US','US teaspoon','Volume',0.003785411784/768,'volume');
    unit('gal_UK','imperial gallon (UK)','Volume',0.00454609,'volume'); unit('qt_UK','imperial quart (UK)','Volume',0.00454609/4,'volume'); unit('pt_UK','imperial pint (UK)','Volume',0.00454609/8,'volume'); unit('fl_oz_UK','imperial fluid ounce (UK)','Volume',0.00454609/160,'volume');
    unit('grain','grain','Mass',0.00006479891,'mass'); unit('stone','stone','Mass',6.35029318,'mass'); unit('ton_US','US short ton','Mass',907.18474,'mass'); unit('ton_UK','imperial long ton','Mass',1016.0469088,'mass'); unit('oz_troy','troy ounce','Mass',0.0311034768,'mass');
    unit('mph','mile per hour','Velocity',0.44704,'velocity'); unit('knot','knot (nautical mile per hour)','Velocity',1852/3600,'velocity'); unit('lbf','pound-force','Force',4.4482216152605,'force'); unit('pdl','poundal','Force',0.138254954376,'force');
    unit('BTU','British thermal unit (international table)','Energy',1055.05585262,'energy'); unit('hp','mechanical horsepower','Power',745.6998715822702,'power'); unit('inHg','inch of mercury at 0 °C','Pressure',3386.389,'pressure');
    unit('rad','radian','Angle',1,'scalar'); unit('sr','steradian','Solid angle',1,'scalar'); unit('deg','degree','Angle',Math.PI/180,'scalar'); unit('rpm','revolutions per minute','Frequency',1/60,'frequency');
    unit('Bq','becquerel','Radioactivity',1,'frequency'); unit('Gy','gray','Absorbed dose',1,'scalar',{dim:[2,0,-2,0,0,0,0]}); unit('Sv','sievert','Equivalent dose',1,'scalar',{dim:[2,0,-2,0,0,0,0]}); unit('lm','lumen','Luminous flux',1,'luminous'); unit('lx','lux','Illuminance',1,'scalar',{dim:[-2,0,0,0,0,0,1]}); unit('kat','katal','Catalytic activity',1,'scalar',{dim:[0,0,-1,0,0,1,0]});
    unit('degC','degree Celsius','Absolute temperature',1,'temperature',{offset:273.15,absolute:true}); unit('degF','degree Fahrenheit','Absolute temperature',5/9,'temperature',{offset:459.67,absolute:true}); unit('deltaC','degree Celsius difference','Temperature difference',1,'temperature'); unit('deltaF','degree Fahrenheit difference','Temperature difference',5/9,'temperature');
    unit('nm_energy','nanometres via E = hc/λ','Energy equivalent',1,'energy',{wavelength:true});
    unit('Hz_energy','hertz via E = hν','Energy equivalent',H,'energy'); unit('rad_s_energy','rad/s via E = ħω','Energy equivalent',HBAR,'energy'); unit('K_energy','kelvin via E = kBT','Energy equivalent',KB,'energy'); unit('T_energy','tesla via E = μBB','Energy equivalent',MUB,'energy');
    U.eV.constants=['e']; U.Hz_energy.constants=['h']; U.rad_s_energy.constants=['hbar']; U.K_energy.constants=['k_B']; U.T_energy.constants=['mu_B']; U.nm_energy.constants=['h','c'];
    const prefixes={Q:1e30,R:1e27,Y:1e24,Z:1e21,E:1e18,P:1e15,T:1e12,G:1e9,M:1e6,k:1e3,h:1e2,da:1e1,d:1e-1,c:1e-2,m:1e-3,u:1e-6,mu:1e-6,µ:1e-6,n:1e-9,p:1e-12,f:1e-15,a:1e-18,z:1e-21,y:1e-24,r:1e-27,q:1e-30};
    const prefixNames={Q:'quetta',R:'ronna',Y:'yotta',Z:'zetta',E:'exa',P:'peta',T:'tera',G:'giga',M:'mega',k:'kilo',h:'hecto',da:'deca',d:'deci',c:'centi',m:'milli',u:'micro',mu:'micro',µ:'micro',n:'nano',p:'pico',f:'femto',a:'atto',z:'zepto',y:'yocto',r:'ronto',q:'quecto'};
    const prefixable=['m','s','g','Hz','J','eV','W','Pa','A','V','N','T','C','K','L','l','mol','cd','F','H','S','Wb','Bq','Gy','Sv','lm','lx','kat','cal','rad_s','Hz_energy','rad_s_energy','K_energy','T_energy'];
    for (const base of prefixable) for(const [p,f] of Object.entries(prefixes)) {
        const key=p+base; if (!U[key]) U[key]={...U[base],symbol:key,name:prefixNames[p]+U[base].name,factor:U[base].factor*f,prefix:p,base};
    }
    U.kcal.prefix='k'; U.kcal.base='cal'; U.kWh.prefix='k'; U.kWh.base='Wh'; U.kg.prefix='k'; U.kg.base='g';
    const constants={h:{name:'Planck constant',value:H,dim:[2,1,-1,0,0,0,0],unit:'J s',latex:'h'},hbar:{name:'Reduced Planck constant',value:HBAR,dim:[2,1,-1,0,0,0,0],unit:'J s',latex:'\\hbar'},k_B:{name:'Boltzmann constant',value:KB,dim:[2,1,-2,0,-1,0,0],unit:'J/K',latex:'k_B'},e:{name:'Elementary charge',value:E,dim:D.charge,unit:'C',latex:'e'},c:{name:'Speed of light in vacuum',value:C,dim:D.velocity,unit:'m/s',latex:'c'},mu_B:{name:'Bohr magneton',value:MUB,dim:[2,0,0,1,0,0,0],unit:'J/T',latex:'\\mu_B'},N_A:{name:'Avogadro constant',value:6.02214076e23,dim:[0,0,0,0,0,-1,0],unit:'1/mol',latex:'N_A'},pi:{name:'Pi',value:Math.PI,dim:D.scalar,unit:'',latex:'\\pi'}};
    for(const [symbol, entry] of Object.entries(scipyConstants || {})) constants[symbol]={...entry,latex:`\\mathrm{${symbol.replaceAll('_','\\_')}}`};
    const commonAliases={
        'electron mass':['m_e','m_e'], 'proton mass':['m_p','m_p'], 'neutron mass':['m_n','m_n'],
        'fine-structure constant':['alpha','\\alpha'], 'vacuum electric permittivity':['epsilon_0','\\epsilon_0'],
        'vacuum mag. permeability':['mu_0','\\mu_0'], 'Newtonian constant of gravitation':['G_N','G_N'],
        'Rydberg constant':['R_inf','R_\\infty'], 'Bohr radius':['a_0','a_0'],
        'molar gas constant':['R_gas','R'], 'Stefan-Boltzmann constant':['sigma_SB','\\sigma_{\\mathrm{SB}}'],
        'mag. flux quantum':['Phi_0','\\Phi_0'], 'Josephson constant':['K_J','K_J'],
        'von Klitzing constant':['R_K','R_K'], 'atomic mass constant':['m_u','m_u'],
        'Faraday constant':['F_const','F'], 'electron g factor':['g_e','g_e'], 'proton g factor':['g_p','g_p'],
        'neutron g factor':['g_n','g_n'], 'Planck length':['l_P','l_P'], 'Planck mass':['m_P','m_P'], 'Planck time':['t_P','t_P']
    };
    for(const [name,[symbol,latex]] of Object.entries(commonAliases)) {
        const original=Object.values(scipyConstants || {}).find(c=>c.name===name);
        if(original) constants[symbol]={...original,latex};
    }
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
        const tokens=tokenize(text); let pos=0; const used=new Set(), usedPrefixes=new Map();
        const peek=()=>tokens[pos], take=()=>tokens[pos++];
        function primary() {
            const t=take(); if(!t) throw Error('Expression is incomplete.');
            if(t.type==='number') return {kind:'number',text:t.value};
            if(t.type==='name') {if(!U[t.value]&&!constants[t.value]) throw Error(`Unknown symbol “${t.value}”. Use uppercase E for scientific notation.`); if(constants[t.value]) used.add(t.value); for(const key of U[t.value]?.constants||[]) used.add(key); if(U[t.value]?.prefix) usedPrefixes.set(U[t.value].prefix,Math.round(Math.log10(prefixes[U[t.value].prefix]))); return {kind:U[t.value]?'unit':'constant',text:t.value};}
            if(t.type==='(') {const node=add(); if(!peek()||take().type!==')') throw Error('Missing closing parenthesis.'); return {kind:'group',child:node};}
            throw Error(`Expected a number, unit, constant or parenthesis.`);
        }
        function power() { let n=primary(); if(peek()?.type==='^') {take(); n={kind:'^',left:n,right:unary()};} return n; }
        function unary() {if(peek()?.type==='-'||peek()?.type==='+') {const op=take().type; return {kind:'unary',op,child:unary()};} return power();}
        function multiply() {let n=unary(); while(peek() && (['*','/','number','name','('].includes(peek().type))) {const implicit=['number','name','('].includes(peek().type); const op=implicit?'*':take().type; n={kind:op,left:n,right:unary(),implicit};} return n;}
        function add() {let n=multiply(); while(peek() && ['+','-'].includes(peek().type)) {const op=take().type;n={kind:op,left:n,right:multiply()};}return n;}
        if(!tokens.length) throw Error('Enter an expression to get started.'); const tree=add(); if(pos<tokens.length) throw Error('Unexpected closing parenthesis.'); return {tree,used:[...used],usedPrefixes:[...usedPrefixes].map(([symbol,power])=>({symbol,power}))};
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
        if(n.kind==='unit') return `\\color{teal}{\\mathrm{${n.text.replaceAll('_','\\_')}}}`;
        if(n.kind==='constant') return `\\color{purple}{${constants[n.text].latex}}`;
        if(n.kind==='group') return `\\left(${latex(n.child)}\\right)`;
        if(n.kind==='unary') return n.op+latex(n.child);
        if(n.kind==='/') return `\\frac{${latex(n.left)}}{${latex(n.right)}}`;
        if(n.kind==='^') return `{${latex(n.left)}}^{${latex(n.right)}}`;
        return `${latex(n.left)} ${n.kind==='*'?'\\cdot':n.kind} ${latex(n.right)}`;
    }
    function evaluate(text) {const parsed=parse(text), result=evaluateNode(parsed.tree); if(!Number.isFinite(result.value) || result.dim.some(x=>!Number.isFinite(x))) throw Error('Result is not finite.'); if(result.absoluteUnit||result.wavelengthUnit) throw Error('Enter a numerical value before this unit.'); if(result.absolute && result.value<0) throw Error('Absolute temperature cannot be below zero kelvin.'); return {...result,latex:latex(parsed.tree),used:parsed.used,usedPrefixes:parsed.usedPrefixes};}
    function dimensionName(dim) {const name=Object.entries(D).find(([,d])=>same(d,dim))?.[0]; return name==='magnetic'?'magnetic flux density':name==='pressure'?'pressure / energy density':name||'composite quantity';}
    function conversions(result) {
        const choices=Object.values(U).filter(u=>same(u.dim,result.dim) && !u.absolute && !u.symbol.includes('_energy') && !['deltaC','deltaF'].includes(u.symbol));
        // Show a concise set of common units, plus physically defined energy equivalences.
        const list=choices.filter(u=>!scalar(result.dim) && !u.prefix).map(u=>({key:u.symbol,label:u.symbol,value:result.value/u.factor,group:u.group,prefixable:prefixable.includes(u.symbol)})).filter(u=>Number.isFinite(u.value));
        if(same(result.dim,D.velocity)) list.push({label:'m/s',value:result.value,group:'Velocity'},{label:'km/h',value:result.value*3.6,group:'Velocity'});
        if(same(result.dim,D.acceleration)) list.push({label:'m/s²',value:result.value,group:'Acceleration'});
        for(const [dimension,label,group] of [
            ['area','m²','Area'],['volume','m³','Volume'],['wavenumber','1/m','Wavenumber'],['momentum','kg m/s','Momentum'],
            ['action / angular momentum','J s','Action / angular momentum'],['electric field strength','V/m','Electric field strength'],
            ['magnetic field strength','A/m','Magnetic field strength'],['mass density','kg/m³','Mass density'],
            ['charge density','C/m³','Charge density'],['surface charge density','C/m²','Surface charge density'],
            ['current density','A/m²','Current density'],['energy density','J/m³','Energy density'],
            ['power density','W/m²','Power density'],['permittivity','F/m','Permittivity'],
            ['permeability','H/m','Permeability'],['molar energy','J/mol','Molar energy'],
            ['specific heat capacity','J/(kg K)','Specific heat capacity']
        ]) if(same(result.dim,D[dimension])) list.push({label,value:result.value,group});
        if(same(result.dim,D.temperature)) {if(!result.temperatureDifference) list.push({label:'°C',value:Math.abs(result.value-273.15)<1e-10?0:result.value-273.15,group:'Absolute temperature'},{label:'°F',value:Math.abs(result.value*9/5-459.67)<1e-10?0:result.value*9/5-459.67,group:'Absolute temperature'}); if(!result.absolute) list.push({label:'Δ°C',value:result.value,group:'Temperature difference'},{label:'Δ°F',value:result.value*9/5,group:'Temperature difference'});}
        if(same(result.dim,D.energy)) {for(const [key,label,via] of [['Hz_energy','Hz','E = h\\nu'],['rad_s_energy','rad/s','E = \\hbar\\omega'],['K_energy','K','E = k_B T'],['T_energy','T','E = \\mu_B B']]) list.push({key,label,via,value:result.value/U[key].factor,group:'Energy equivalent',prefixable:true}); if(result.value>0) list.push({key:'nm_energy',label:'nm',via:'E = hc/\\lambda',value:H*C/result.value*1e9,group:'Energy equivalent'});}
        return list.map(row=>({...row,key:row.key||row.label}));
    }
    function searchItems(items, query) {
        const original=query.trim(); query=original.toLowerCase();
        const rank=x=>{const s=x.symbol.toLowerCase(), n=x.name.toLowerCase(), aliases=(x.keywords||'').toLowerCase().split(/\s+/); return !query?0:x.symbol===original?0:s===query?1:n===query||aliases.includes(query)?2:x.symbol.startsWith(original)?3:s.startsWith(query)?4:n.startsWith(query)?5:6;};
        return items.filter(x=>`${x.symbol} ${x.name} ${x.keywords||''}`.toLowerCase().includes(query)).sort((a,b)=>rank(a)-rank(b));
    }
    function constantItems() {
        const seen=new Map();
        Object.entries(constants).sort(([a],[b])=>Number(a.startsWith('scipy_'))-Number(b.startsWith('scipy_'))).forEach(([symbol,c])=>{
            const name=c.name.toLowerCase();
            if(seen.has(name)) seen.get(name).keywords+=` ${symbol}`;
            else seen.set(name,{symbol,name:c.name,keywords:symbol,type:'constant'});
        });
        return [...seen.values()];
    }
    function completions(text, cursor) {
        const before=text.slice(0,cursor), token=before.match(/[A-Za-zµ_][A-Za-z0-9µ_]*$/);
        if(!token) return {start:cursor,end:cursor,items:[]};
        const query=token[0].toLowerCase();
        const unitItems=Object.values(U).filter(u=>!u.prefix || (query.length>=2 && u.symbol.toLowerCase().startsWith(query))).map(u=>({symbol:u.symbol,name:u.name,type:'unit'}));
        const pool=[...constantItems(),...unitItems];
        const items=searchItems(pool,token[0]).filter(x=>x.symbol.toLowerCase().startsWith(query)||x.name.toLowerCase().startsWith(query)).slice(0,8);
        const remainder=text.slice(cursor).match(/^[A-Za-z0-9µ_]*/)[0];
        return {start:cursor-token[0].length,end:cursor+remainder.length,items};
    }
    function chooseDefault(result, text, choices) {
        const name=dimensionName(result.dim);
        const preferred={energy:/eV\b/.test(text)?'eV':'J',frequency:'Hz',length:'m',mass:'g',time:'s',temperature:'K',force:'N',power:'W','pressure / energy density':'Pa',charge:'C',voltage:'V',resistance:'ohm','magnetic flux density':'T',current:'A',amount:'mol',luminous:'cd',volume:'m³',capacitance:'F',inductance:'H',conductance:'S','magnetic flux':'Wb'}[name];
        if(!preferred) return choices[0]?.label || '';
        return choices.find(row=>row.label===preferred && row.group!=='Energy equivalent')?.key || choices[0]?.key || choices[0]?.label || '';
    }
    function scaledChoice(choice) {
        if(!choice.prefixable || !choice.value) return {value:choice.value,label:choice.label,power:0,prefix:''};
        const scales=[['Q',30],['R',27],['Y',24],['Z',21],['E',18],['P',15],['T',12],['G',9],['M',6],['k',3],['',0],['m',-3],['µ',-6],['n',-9],['p',-12],['f',-15],['a',-18],['z',-21],['y',-24],['r',-27],['q',-30]];
        const found=scales.find(([,power])=>Math.abs(choice.value)/10**power>=1 && Math.abs(choice.value)/10**power<1000);
        if(!found) return {value:choice.value,label:choice.label,power:0,prefix:''};
        const [prefix,power]=found; return {value:choice.value/10**power,label:prefix+choice.label,power,prefix};
    }
    return {units:U,constants,dimensions:D,parse,evaluate,conversions,dimensionName,searchItems,constantItems,completions,chooseDefault,scaledChoice};
});
