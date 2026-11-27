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
    // CGS mechanical and Gaussian magnetic units, expressed in SI base units.
    unit('dyn','dyne (CGS)','Force',1e-5,'force'); unit('erg','erg (CGS)','Energy',1e-7,'energy');
    unit('Ba','barye (CGS)','Pressure',0.1,'pressure'); unit('Gal','gal (CGS)','Acceleration',0.01,'acceleration');
    unit('P','poise (CGS)','Dynamic viscosity',0.1,'scalar',{dim:[-1,1,-1,0,0,0,0]});
    unit('St','stokes (CGS)','Kinematic viscosity',1e-4,'scalar',{dim:[2,0,-1,0,0,0,0]});
    unit('Mx','maxwell (CGS)','Magnetic flux',1e-8,'magnetic flux');
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
    // Curated standalone symbols; conversions and ratios can be expressed
    // using these quantities and units. Numerical values remain CODATA 2018.
    // Symbols follow https://physics.nist.gov/cuu/pdf/all.pdf.
    const commonAliases={
        'electron mass':['m_e','m_e'], 'proton mass':['m_p','m_p'], 'neutron mass':['m_n','m_n'],
        'fine-structure constant':['alpha','\\alpha'], 'vacuum electric permittivity':['epsilon_0','\\epsilon_0'],
        'vacuum mag. permeability':['mu_0','\\mu_0'], 'Newtonian constant of gravitation':['G_N','G_N'],
        'Rydberg constant':['R_inf','R_\\infty'], 'Bohr radius':['a_0','a_0'],
        'molar gas constant':['R_gas','R'], 'Stefan-Boltzmann constant':['sigma_SB','\\sigma_{\\mathrm{SB}}'],
        'mag. flux quantum':['Phi_0','\\Phi_0'], 'Josephson constant':['K_J','K_J'],
        'von Klitzing constant':['R_K','R_K'], 'atomic mass constant':['m_u','m_u'],
        'Faraday constant':['F_const','F'], 'electron g factor':['g_e','g_e'], 'proton g factor':['g_p','g_p'],
        'neutron g factor':['g_n','g_n'], 'Planck length':['l_P','l_P'], 'Planck mass':['m_P','m_P'], 'Planck time':['t_P','t_P'],
        'electron gyromag. ratio':['gamma_e','\\gamma_e'], 'proton gyromag. ratio':['gamma_p','\\gamma_p'], 'neutron gyromag. ratio':['gamma_n','\\gamma_n'],
        'shielded proton gyromag. ratio':['gamma_p_shielded',"{\\gamma'_p}"], 'shielded helion gyromag. ratio':['gamma_h_shielded',"{\\gamma'_h}"],
        'electron mag. mom.':['mu_e','\\mu_e'], 'proton mag. mom.':['mu_p','\\mu_p'], 'neutron mag. mom.':['mu_n','\\mu_n'],
        'muon mag. mom.':['mu_mu','\\mu_\\mu'], 'deuteron mag. mom.':['mu_d','\\mu_d'], 'triton mag. mom.':['mu_t','\\mu_t'],
        'helion mag. mom.':['mu_h','\\mu_h'], 'nuclear magneton':['mu_N','\\mu_N'],
        'muon mass':['m_mu','m_\\mu'], 'tau mass':['m_tau','m_\\tau'], 'deuteron mass':['m_d','m_d'],
        'triton mass':['m_t','m_t'], 'helion mass':['m_h','m_h'], 'alpha particle mass':['m_alpha','m_\\alpha'],
        'electron molar mass':['M_e','M_e'], 'proton molar mass':['M_p','M_p'], 'neutron molar mass':['M_n','M_n'],
        'muon molar mass':['M_mu','M_\\mu'], 'tau molar mass':['M_tau','M_\\tau'], 'deuteron molar mass':['M_d','M_d'],
        'triton molar mass':['M_t','M_t'], 'helion molar mass':['M_h','M_h'], 'alpha particle molar mass':['M_alpha','M_\\alpha'],
        'electron relative atomic mass':['A_r_e','A_r(e)'], 'proton relative atomic mass':['A_r_p','A_r(p)'], 'neutron relative atomic mass':['A_r_n','A_r(n)'],
        'deuteron relative atomic mass':['A_r_d','A_r(d)'], 'triton relative atomic mass':['A_r_t','A_r(t)'], 'helion relative atomic mass':['A_r_h','A_r(h)'], 'alpha particle relative atomic mass':['A_r_alpha','A_r(\\alpha)'],
        'muon g factor':['g_mu','g_\\mu'], 'deuteron g factor':['g_d','g_d'], 'triton g factor':['g_t','g_t'], 'helion g factor':['g_h','g_h'],
        'electron mag. mom. anomaly':['a_e','a_e'], 'muon mag. mom. anomaly':['a_mu','a_\\mu'],
        'characteristic impedance of vacuum':['Z_0','Z_0'], 'classical electron radius':['r_e','r_e'],
        'proton rms charge radius':['r_p','r_p'], 'deuteron rms charge radius':['r_d','r_d'],
        'Compton wavelength':['lambda_C','\\lambda_C'], 'reduced Compton wavelength':['lambda_C_bar','\\bar{\\lambda}_C'],
        'muon Compton wavelength':['lambda_C_mu','\\lambda_{C,\\mu}'], 'proton Compton wavelength':['lambda_C_p','\\lambda_{C,p}'],
        'neutron Compton wavelength':['lambda_C_n','\\lambda_{C,n}'], 'tau Compton wavelength':['lambda_C_tau','\\lambda_{C,\\tau}'],
        'reduced muon Compton wavelength':['lambda_C_mu_bar','\\bar{\\lambda}_{C,\\mu}'], 'reduced proton Compton wavelength':['lambda_C_p_bar','\\bar{\\lambda}_{C,p}'],
        'reduced neutron Compton wavelength':['lambda_C_n_bar','\\bar{\\lambda}_{C,n}'], 'reduced tau Compton wavelength':['lambda_C_tau_bar','\\bar{\\lambda}_{C,\\tau}'],
        'conductance quantum':['G_0','G_0'], 'Hartree energy':['E_h','E_h'],
        'Planck temperature':['T_P','T_P'], 'Thomson cross section':['sigma_T','\\sigma_T'],
        'first radiation constant':['c_1','c_1'], 'second radiation constant':['c_2','c_2'],
        'Wien wavelength displacement law constant':['b_Wien','b'], 'Wien frequency displacement law constant':['b_nu','b_\\nu'],
        'standard acceleration of gravity':['g_0','g_0'], 'molar mass constant':['M_u','M_u']
    };
    for(const [name,[symbol,latex]] of Object.entries(commonAliases)) {
        const original=Object.values(scipyConstants || {}).find(c=>c.name===name);
        if(original) constants[symbol]={...original,latex};
    }
    // Retain old spellings only for constants that have a curated symbol, so
    // existing saved expressions keep working without listing duplicate names.
    const legacyAliases={};
    for(const [old,entry] of Object.entries(scipyConstants || {})) {
        const symbol=Object.keys(constants).find(key=>constants[key].name.toLowerCase()===entry.name.toLowerCase());
        if(!symbol) continue;
        legacyAliases[old]=symbol;
        const short=old.replace(/^scipy_/, '');
        if(!U[short] && !constants[short]) legacyAliases[short]=symbol;
    }
    for(const [symbol,constant] of Object.entries(constants)) if(!constant.source) constant.source=symbol==='pi'?'Mathematical constant':'SciPy 1.14.1 / CODATA 2018';
    const FUNCTIONS={frac:'Fraction (numerator, denominator)',sqrt:'Square root',sin:'Sine',cos:'Cosine',tan:'Tangent',asin:'Inverse sine',acos:'Inverse cosine',atan:'Inverse tangent',sinh:'Hyperbolic sine',cosh:'Hyperbolic cosine',tanh:'Hyperbolic tangent',ln:'Natural logarithm',log:'Base-10 logarithm',exp:'Exponential',abs:'Absolute value',re:'Real part',im:'Imaginary part',Re:'Real part',Im:'Imaginary part',conj:'Complex conjugate',arg:'Complex argument',Arg:'Complex argument',floor:'Round down',ceil:'Round up',factorial:'Factorial',mod:'Remainder (two arguments)',pow:'Power (two arguments)',recip:'Reciprocal',percent:'Percentage',tenpow:'10 to the power'};
    const same=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-10);
    const scalar=d=>same(d,D.scalar);
    function tokenize(text) {
        const result=[]; let i=0;
        while(i<text.length) {
            if (/\s/.test(text[i])) { i++; continue; }
            const rest=text.slice(i), num=rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:E[+-]?\d+)?/), ident=rest.match(/^[A-Za-zµ_][A-Za-z0-9µ_]*/);
            if(num) { result.push({type:'number',value:num[0],start:i,end:i+num[0].length}); i+=num[0].length; continue; }
            if(ident) { result.push({type:'name',value:ident[0],start:i,end:i+ident[0].length}); i+=ident[0].length; continue; }
            if(rest.startsWith('**')) {result.push({type:'^',value:'^',start:i,end:i+2}); i+=2; continue;}
            if('+-*/^(),!%'.includes(text[i])) {result.push({type:text[i],value:text[i],start:i,end:i+1}); i++; continue;}
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
            if(t.type==='name' && Object.hasOwn(FUNCTIONS,t.value)) {
                if(!peek()||take().type!=='(') throw Error(`Use ${t.value}(...) with parentheses.`);
                const args=[add()]; while(peek()?.type===',') {take(); args.push(add());}
                if(!peek()||take().type!==')') throw Error('Missing closing parenthesis.');
                return {kind:'function',name:({Re:'re',Im:'im',Arg:'arg'})[t.value]||t.value,args};
            }
            if(t.type==='name' && t.value==='i') return {kind:'imaginary'};
            if(t.type==='name' && t.value==='euler') return {kind:'euler'};
            if(t.type==='name') {const symbol=U[t.value]?t.value:(legacyAliases[t.value]||t.value); if(!U[symbol]&&!constants[symbol]) throw Error(`Unknown symbol “${t.value}”. Use uppercase E for scientific notation.`); if(constants[symbol]) used.add(symbol); for(const key of U[symbol]?.constants||[]) used.add(key); if(U[symbol]?.prefix) usedPrefixes.set(U[symbol].prefix,Math.round(Math.log10(prefixes[U[symbol].prefix]))); return {kind:U[symbol]?'unit':'constant',text:symbol};}
            if(t.type==='(') {const node=add(); if(!peek()||take().type!==')') throw Error('Missing closing parenthesis.'); return {kind:'group',child:node};}
            throw Error(`Expected a number, unit, constant or parenthesis.`);
        }
        function power() { let n=primary(); while(peek() && ['!','%'].includes(peek().type)) n={kind:'postfix',op:take().type,child:n}; if(peek()?.type==='^') {take(); n={kind:'^',left:n,right:unary()};} return n; }
        function unary() {if(peek()?.type==='-'||peek()?.type==='+') {const op=take().type; return {kind:'unary',op,child:unary()};} return power();}
        function multiply() {
            let n=unary();
            while(peek() && (['*','/','number','name','('].includes(peek().type))) {
                const implicit=['number','name','('].includes(peek().type), op=implicit?'*':take().type;
                let right=unary();
                // A unit touching a denominator's number belongs to that quantity:
                // 5V / 10A = 5V / (10 A), while 5V / 10 A = (5V / 10) * A.
                const previous=tokens[pos-1], next=peek();
                if(op==='/' && previous?.type==='number' && next?.type==='name' && previous.end===next.start && Object.hasOwn(U,next.value)) {
                    right={kind:'*',left:right,right:power(),implicit:true};
                }
                n={kind:op,left:n,right,implicit};
            }
            return n;
        }
        function add() {let n=multiply(); while(peek() && ['+','-'].includes(peek().type)) {const op=take().type;n={kind:op,left:n,right:multiply()};}return n;}
        if(!tokens.length) throw Error('Enter an expression to get started.'); const tree=add(); if(pos<tokens.length) throw Error('Unexpected closing parenthesis.'); return {tree,used:[...used],usedPrefixes:[...usedPrefixes].map(([symbol,power])=>({symbol,power}))};
    }
    function evaluateNode(n, angleMode='rad') {
        const evaluateChild=node=>evaluateNode(node,angleMode);
        const imaginary=q=>q.imag??0;
        const number=(r,i=0,dim=D.scalar)=>({value:r,imag:i,dim});
        const multiplication=(a,b)=>[a.value*b.value-imaginary(a)*imaginary(b),a.value*imaginary(b)+imaginary(a)*b.value];
        const divide=(a,b)=>{const d=b.value*b.value+imaginary(b)*imaginary(b); if(!d) throw Error('Division by zero.'); return [(a.value*b.value+imaginary(a)*imaginary(b))/d,(imaginary(a)*b.value-a.value*imaginary(b))/d];};
        const cpow=(a,b)=>{ if(!imaginary(a) && !imaginary(b) && (a.value>=0 || Number.isInteger(b.value))) return [a.value**b.value,0]; const magnitude=Math.hypot(a.value,imaginary(a)); if(!magnitude) throw Error('Undefined power of zero.'); const l=Math.log(magnitude), phi=Math.atan2(imaginary(a)||0,a.value), r=Math.exp(b.value*l-imaginary(b)*phi), t=b.value*phi+imaginary(b)*l; return [r*Math.cos(t),r*Math.sin(t)]; };
        if(n.kind==='imaginary') return number(0,1);
        if(n.kind==='euler') return number(Math.E);
        if(n.kind==='postfix') return evaluateChild({kind:'function',name:n.op==='!'?'factorial':'percent',args:[n.child]});
        if(n.kind==='function') {
            const expected=['mod','pow','frac'].includes(n.name)?2:1;
            if(n.args.length!==expected) throw Error(`${n.name} expects ${expected} argument${expected===1?'':'s'}.`);
            const a=evaluateChild(n.args[0]), ai=imaginary(a), dimless=scalar(a.dim), out=(v,i=0,dim=D.scalar)=>number(v,i,dim);
            if(a.absolute||a.absoluteUnit||a.wavelengthUnit) throw Error('Functions cannot be applied to absolute temperature or wavelength units.');
            if(n.name==='sqrt') {const [r,i]=cpow(a,number(0.5)); return out(r,i,a.dim.map(d=>d/2));}
            if(n.name==='abs') return out(Math.hypot(a.value,ai),0,a.dim);
            if(n.name==='re') return out(a.value,0,a.dim);
            if(n.name==='im') return out(ai,0,a.dim);
            if(n.name==='conj') return out(a.value,-ai,a.dim);
            if(n.name==='arg') {if(!a.value&&!ai) throw Error('The argument of zero is undefined.'); return out(Math.atan2(ai,a.value)*(angleMode==='deg'?180/Math.PI:1));}
            if(n.name==='percent') return out(a.value/100,ai/100,a.dim);
            if(n.name==='recip') {const [r,i]=divide(number(1),a);return out(r,i,a.dim.map(d=>-d));}
            if(n.name==='pow') return evaluateChild({kind:'^',left:n.args[0],right:n.args[1]});
            if(n.name==='frac') return evaluateChild({kind:'/',left:n.args[0],right:n.args[1]});
            if(n.name==='mod') {const b=evaluateChild(n.args[1]); if(!same(a.dim,b.dim)||ai||imaginary(b)) throw Error('mod requires real arguments with matching dimensions.'); if(!b.value) throw Error('Division by zero.'); return out(a.value%b.value,0,a.dim);}
            if(!dimless) throw Error(`${n.name} requires a dimensionless argument.`);
            if(n.name==='factorial') {if(ai||!Number.isInteger(a.value)||a.value<0||a.value>170) throw Error('Factorial requires an integer from 0 to 170.'); let v=1; for(let i=2;i<=a.value;i++)v*=i; return out(v);}
            if(['floor','ceil'].includes(n.name)) {if(ai) throw Error(`${n.name} requires a real argument.`);return out(Math[n.name](a.value));}
            if(['asin','acos','atan'].includes(n.name)) {if(ai) throw Error(`${n.name} currently requires a real argument.`); const v=Math[n.name](a.value);if(!Number.isFinite(v)) throw Error(`${n.name} argument is outside its real domain.`);return out(v*(angleMode==='deg'?180/Math.PI:1));}
            let x=a.value,y=ai;
            if(['sin','cos','tan'].includes(n.name) && angleMode==='deg' && !a.angle) {x*=Math.PI/180;y*=Math.PI/180;}
            // Correct roundoff at nonzero multiples of π/2 without rounding
            // genuinely small angles (or small values elsewhere) to zero.
            const halfTurns=Math.round(x/(Math.PI/2));
            const atCardinal=halfTurns!==0 && Math.abs(x)<1e6 && Math.abs(x-halfTurns*(Math.PI/2))<=2*Number.EPSILON*Math.abs(x);
            const sinX=atCardinal && halfTurns%2===0 ? 0 : Math.sin(x);
            const cosX=atCardinal && Math.abs(halfTurns%2)===1 ? 0 : Math.cos(x);
            const sin=[sinX*Math.cosh(y),cosX*Math.sinh(y)], cos=[cosX*Math.cosh(y),-sinX*Math.sinh(y)];
            const sinh=[Math.sinh(x)*Math.cos(y),Math.cosh(x)*Math.sin(y)], cosh=[Math.cosh(x)*Math.cos(y),Math.sinh(x)*Math.sin(y)];
            if(n.name==='sin') return out(...sin); if(n.name==='cos') return out(...cos); if(n.name==='tan') return out(...divide(number(...sin),number(...cos)));
            if(n.name==='sinh') return out(...sinh); if(n.name==='cosh') return out(...cosh); if(n.name==='tanh') return out(...divide(number(...sinh),number(...cosh)));
            if(n.name==='ln'||n.name==='log') {if(!x&&!y) throw Error('Logarithm of zero is undefined.'); const base=n.name==='log'?Math.LN10:1; return out(Math.log(Math.hypot(x,y))/base,Math.atan2(y||0,x)/base);}
            if(n.name==='exp'||n.name==='tenpow') {const scale=n.name==='tenpow'?Math.LN10:1, r=Math.exp(x*scale); return out(r*Math.cos(y*scale),r*Math.sin(y*scale));}
            throw Error(`Unsupported function ${n.name}.`);
        }
        if(n.kind==='number') return {value:Number(n.text),dim:D.scalar};
        if(n.kind==='unit') {const u=U[n.text]; return {value:u.factor,dim:u.dim,unit:n.text,angle:n.text==='deg'||n.text==='rad',absoluteUnit:!!u.absolute,wavelengthUnit:!!u.wavelength,temperatureDifference:n.text==='deltaC'||n.text==='deltaF'};}
        if(n.kind==='constant') {const c=constants[n.text]; return {value:c.value,dim:c.dim};}
        if(n.kind==='group') return evaluateChild(n.child);
        if(n.kind==='unary') {const a=evaluateChild(n.child); if(a.absolute) throw Error('An absolute temperature cannot be negated.'); return {...a,value:n.op==='-'?-a.value:a.value,imag:n.op==='-'?-imaginary(a):imaginary(a)};}
        const a=evaluateChild(n.left), b=evaluateChild(n.right);
        if(n.kind==='+'||n.kind==='-') {
            if(!same(a.dim,b.dim)) throw Error('Cannot add or subtract quantities with different dimensions.');
            if(a.absolute && b.absolute && n.kind==='+') throw Error('Two absolute temperatures cannot be added.');
            if(!a.absolute && b.absolute && n.kind==='-') throw Error('Cannot subtract an absolute temperature from a difference.');
            return {value:n.kind==='+'?a.value+b.value:a.value-b.value,imag:n.kind==='+'?imaginary(a)+imaginary(b):imaginary(a)-imaginary(b),dim:a.dim,angle:!!(a.angle&&b.angle),absolute:a.absolute&&b.absolute?false:(a.absolute||b.absolute),temperatureDifference:!!(a.absolute&&b.absolute || a.temperatureDifference||b.temperatureDifference) && !(a.absolute!==b.absolute && (a.absolute||b.absolute))};
        }
        if(n.kind==='^') {if(a.absolute||a.absoluteUnit||!scalar(b.dim)||b.absolute||(!scalar(a.dim)&&imaginary(b))) throw Error('A power must be dimensionless and cannot contain an absolute temperature.'); const [r,i]=cpow(a,b); return {value:r,imag:i,dim:a.dim.map(x=>x*b.value)};}
        if(n.kind==='*' && ((scalar(a.dim)&&b.absoluteUnit)||(scalar(b.dim)&&a.absoluteUnit))) {const number=scalar(a.dim)?a:b, u=U[(scalar(a.dim)?b:a).unit]; if(imaginary(number)) throw Error('Absolute temperatures must be real.'); return {value:(number.value+u.offset)*u.factor,dim:u.dim,absolute:true};}
        if(n.kind==='*' && ((scalar(a.dim)&&b.wavelengthUnit)||(scalar(b.dim)&&a.wavelengthUnit))) {const number=scalar(a.dim)?a:b; if(number.value<=0 || imaginary(number)) throw Error('Wavelength must be positive and real.'); return {value:H*C/(number.value*1e-9),dim:D.energy};}
        if(a.wavelengthUnit||b.wavelengthUnit) throw Error('Enter a positive value before nm_energy.');
        if(a.absolute||b.absolute||a.absoluteUnit||b.absoluteUnit) throw Error('Absolute Celsius and Fahrenheit values cannot be multiplied or divided. Use deltaC or deltaF for differences.');
        const [real,imag]=n.kind==='*'?multiplication(a,b):divide(a,b);
        return {value:real,imag,angle:!!(n.kind==='*'&&(a.angle||b.angle)||n.kind==='/'&&a.angle&&!b.angle&&scalar(b.dim)),dim:a.dim.map((v,i)=>v+(n.kind==='*'?b.dim[i]:-b.dim[i])),temperatureDifference:!!(a.temperatureDifference&&scalar(b.dim)||b.temperatureDifference&&scalar(a.dim)&&n.kind==='*')};
    }
    function latex(n) {
        if(n.kind==='imaginary') return 'i';
        if(n.kind==='euler') return '\\mathrm{e}';
        if(n.kind==='function') { const args=n.args.map(latex); if(n.name==='frac') return `\\frac{${args[0]}}{${args[1]}}`; if(n.name==='sqrt') return `{\\color{brown}\\sqrt{{\\color{black}${args[0]}}}}`; if(n.name==='abs') return `{\\color{brown}\\left|{\\color{black}${args[0]}}\\right|}`; return `{\\color{brown}\\operatorname{${n.name}}\\left({\\color{black}${args.join(', ')}}\\right)}`; }
        if(n.kind==='postfix') return `{${latex(n.child)}}${n.op==='%'?'\\%':'!'}`;
        if(n.kind==='number') {const parts=n.text.split('E'); return parts.length===2?`${parts[0]}\\times 10^{${Number(parts[1])}}`:n.text;}
        if(n.kind==='unit') {
            const symbols={ohm:'\\Omega',degC:'{}^\\circ\\mathrm{C}',degF:'{}^\\circ\\mathrm{F}',deltaC:'\\Delta{}^\\circ\\mathrm{C}',deltaF:'\\Delta{}^\\circ\\mathrm{F}'};
            const unit=U[n.text];
            const rendered=['u','mu','µ'].includes(unit.prefix)?`\\mu\\mathrm{${unit.base.replaceAll('_','\\_')}}`:`\\mathrm{${n.text.replaceAll('_','\\_')}}`;
            return `{\\color{teal}${symbols[n.text]||rendered}}`;
        }
        if(n.kind==='constant') return `{\\color{purple}${constants[n.text].latex}}`;
        if(n.kind==='group') return `\\left(${latex(n.child)}\\right)`;
        if(n.kind==='unary') return n.op+latex(n.child);
        if(n.kind==='/') {
            const numeric=node=>node.kind==='number' || (node.kind==='unary' && node.child.kind==='number');
            const unitsOnly=node=>node.kind==='unit' || (node.kind==='^' && unitsOnly(node.left)) || (node.kind==='*' && unitsOnly(node.left) && unitsOnly(node.right));
            if(n.left.kind==='*' && n.left.implicit && numeric(n.left.left) && unitsOnly(n.left.right) && unitsOnly(n.right)) {
                return `${latex(n.left.left)}\\,\\tfrac{${latex(n.left.right)}}{${latex(n.right)}}`;
            }
            return `\\tfrac{${latex(n.left)}}{${latex(n.right)}}`;
        }
        if(n.kind==='^') return `{${latex(n.left)}}^{${latex(n.right)}}`;
        const isNumber=node=>node.kind==='number' || (node.kind==='unary' && node.child.kind==='number');
        // Multiplication is left associative: in x * 0.1V the unit is
        // attached to the whole preceding product, whose last factor is 0.1.
        const numeric=isNumber(n.left) || (['*','/'].includes(n.left.kind) && isNumber(n.left.right));
        const unit=n.right.kind==='unit' || (n.right.kind==='^' && n.right.left.kind==='unit');
        if(n.kind==='*' && n.implicit && numeric && unit) return `${latex(n.left)}\\, ${latex(n.right)}`;
        return `${latex(n.left)} ${n.kind==='*'?'\\cdot':n.kind} ${latex(n.right)}`;
    }
    function evaluate(text, angleMode='rad') {if(!['rad','deg'].includes(angleMode)) throw Error('Unknown angle mode.'); const parsed=parse(text), result=evaluateNode(parsed.tree,angleMode); if(!Number.isFinite(result.value) || !Number.isFinite(result.imag??0) || result.dim.some(x=>!Number.isFinite(x))) throw Error('Result is not finite.'); if(result.absoluteUnit||result.wavelengthUnit) throw Error('Enter a numerical value before this unit.'); if(result.absolute && result.value<0) throw Error('Absolute temperature cannot be below zero kelvin.'); return {...result,latex:latex(parsed.tree),used:parsed.used,usedPrefixes:parsed.usedPrefixes};}
    function dimensionName(dim) {const name=Object.entries(D).find(([,d])=>same(d,dim))?.[0]; return name==='magnetic'?'magnetic flux density':name==='pressure'?'pressure / energy density':name||'composite quantity';}
    function conversions(result) {
        if(result.imag) {
            const real=conversions({...result,imag:0}), imag=conversions({...result,value:result.imag,imag:0});
            return real.filter(row=>row.key!=='nm_energy'&&!['Absolute temperature','Temperature difference'].includes(row.group)).map(row=>({...row,imag:imag.find(other=>other.key===row.key)?.value??0}));
        }
        const choices=Object.values(U).filter(u=>same(u.dim,result.dim) && !u.absolute && !u.symbol.includes('_energy') && !['deltaC','deltaF'].includes(u.symbol));
        // Show a concise set of common units, plus physically defined energy equivalences.
        const list=choices.filter(u=>!scalar(result.dim) && !u.prefix).map(u=>({key:u.symbol,label:u.symbol,value:result.value/u.factor,group:u.group,constants:u.constants||[],prefixable:prefixable.includes(u.symbol)})).filter(u=>Number.isFinite(u.value));
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
        if(same(result.dim,D.energy)) {for(const [key,label,via,used] of [['Hz_energy','Hz','E = h\\nu',['h']],['rad_s_energy','rad/s','E = \\hbar\\omega',['hbar']],['K_energy','K','E = k_B T',['k_B']],['T_energy','T','E = \\mu_B B',['mu_B']]]) list.push({key,label,via,constants:used,value:result.value/U[key].factor,group:'Energy equivalent',prefixable:true}); if(result.value>0 && !result.imag) list.push({key:'nm_energy',label:'nm',via:'E = hc/\\lambda',constants:['h','c'],value:H*C/result.value*1e9,group:'Energy equivalent'});}
        return list.map(row=>({...row,key:row.key||row.label}));
    }
    function requestedConversion(result, target, source='') {
        target=target.trim();
        if(!target) throw Error('Enter a unit after eq.');
        const choices=conversions(result), unit=U[target];
        // A target energy unit may be requested from a frequency, temperature,
        // magnetic flux density or wavelength. Preserve the original dimensions
        // unless this conversion is explicitly requested.
        const sourceAngular=same(result.dim,D.frequency) && (result.angle || tokenize(source).some(t=>t.type==='name' && (U[t.value]?.base||t.value)==='rad_s'));
        const targetAngular=unit && (unit.base||target)==='rad_s';
        const equivalentTarget=unit && (same(unit.dim,D.energy) || same(unit.dim,D.frequency) || same(unit.dim,D.temperature) || same(unit.dim,D.magnetic) || same(unit.dim,D.length));
        const angularChange=unit && same(result.dim,D.frequency) && same(unit.dim,D.frequency) && !!sourceAngular!==!!targetAngular;
        if(equivalentTarget && !same(result.dim,D.energy) && (!same(unit.dim,result.dim) || angularChange)) {
            let factor, via, used, prefix;
            if(same(result.dim,D.frequency)) {
                const angular=sourceAngular;
                factor=angular?HBAR:H; via=angular?'E = \\hbar\\omega':'E = h\\nu'; used=[angular?'hbar':'h']; prefix=angular?'\\hbar':'h';
            } else if(same(result.dim,D.temperature)) {factor=KB; via='E = k_B T'; used=['k_B']; prefix='k_B';}
            else if(same(result.dim,D.magnetic)) {factor=MUB; via='E = \\mu_B B'; used=['mu_B']; prefix='\\mu_B';}
            else if(same(result.dim,D.length)) {
                if(result.imag || result.value<=0) throw Error('Wavelength must be positive and real.');
                via='E = hc/\\lambda'; used=['h','c']; prefix='\\frac{hc}';
            } else throw Error('The requested energy unit is not compatible with this result.');
            const energy={...result,value:factor===undefined?H*C/result.value:result.value*factor,imag:factor===undefined?0:(result.imag||0)*factor,dim:D.energy,absolute:false,temperatureDifference:false};
            const choice=requestedConversion(energy,target);
            if((unit.base||target)==='eV') used.push('e');
            return {...choice,via:[via,choice.via].filter((v,i,a)=>v && a.indexOf(v)===i).join(',\\quad '),constants:[...new Set([...used,...(choice.constants||[])])],convertedResult:energy,sourceFactor:prefix,sourceReciprocal:factor===undefined};
        }
        const special={degC:'°C',degF:'°F',deltaC:'Δ°C',deltaF:'Δ°F'};
        if(unit && special[target]) {
            if(same(result.dim,D.energy)) {
                if(result.imag) throw Error('Temperature equivalent must be real.');
                const kelvin=result.value/KB;
                const value=target==='degC'?kelvin-273.15:target==='degF'?kelvin*9/5-459.67:target==='deltaF'?kelvin*9/5:kelvin;
                return {key:'eq:'+target,label:special[target],group:'Energy equivalent',via:'E = k_B T',constants:['k_B'],value,prefixable:false,temperatureKelvin:kelvin};
            }
            const choice=choices.find(row=>row.key===special[target]);
            if(!choice) throw Error('That temperature unit is not compatible with this result.');
            return {...choice,key:'eq:'+target,prefixable:false};
        }
        if(unit && same(result.dim,D.energy)) {
            const base=unit.base || target;
            if(same(unit.dim,D.length)) {
                if(result.imag || result.value<=0) throw Error('Wavelength requires a positive, real energy.');
                return {key:'eq:'+target,label:target,group:'Energy equivalent',via:'E = hc/\\lambda',constants:['h','c'],value:H*C/result.value/unit.factor,prefixable:!unit.prefix && prefixable.includes(target),reciprocal:true};
            }
            const equivalent=target==='nm'?'nm_energy':{Hz:'Hz_energy',rad_s:'rad_s_energy',K:'K_energy',T:'T_energy'}[base];
            const direct=target.endsWith('_energy')?target:equivalent;
            if(direct) {
                const energyUnit=target.endsWith('_energy')?U[direct]:(U[(unit.prefix||'')+direct] || U[direct]);
                const baseEnergy=energyUnit?.base || direct;
                const choice=choices.find(row=>row.key===baseEnergy);
                if(!choice) throw Error('That energy equivalent is not available for this result.');
                if(baseEnergy==='nm_energy') return {...choice,key:'eq:'+target,prefixable:false};
                const factor=energyUnit?.factor || U[direct].factor;
                return {...choice,key:'eq:'+target,label:target.replace(/_energy$/,'').replace('rad_s','rad/s'),value:result.value/factor,imag:(result.imag||0)/factor,prefixable:!unit.prefix && prefixable.includes(baseEnergy)};
            }
        }
        // Unit expressions may arrive as editable LaTeX fractions or roots.
        // Validate their AST instead of rejecting the editor's frac() syntax.
        function unitExpression(node,power=false) {
            if(node.kind==='unit')return !power;
            if(node.kind==='number')return power || Number(node.text)===1;
            if(node.kind==='group')return unitExpression(node.child,power);
            if(node.kind==='unary')return power && unitExpression(node.child,true);
            if(node.kind==='^')return unitExpression(node.left) && unitExpression(node.right,true);
            if(['*','/'].includes(node.kind))return unitExpression(node.left,power) && unitExpression(node.right,power);
            if(node.kind==='function' && node.name==='frac')return node.args.length===2 && node.args.every(arg=>unitExpression(arg,power));
            if(node.kind==='function' && node.name==='sqrt')return node.args.length===1 && unitExpression(node.args[0],power);
            return false;
        }
        let reference;
        try {
            const parsed=parse(target);
            if(!unitExpression(parsed.tree))throw Error('Invalid target unit.');
            reference=evaluate(target);
        } catch {throw Error('Enter a valid unit after eq.');}
        if(!same(result.dim,reference.dim) || reference.absolute || reference.imag || !reference.value) throw Error('The requested unit is not compatible with the result.');
        return {key:'eq:'+target,label:target.replaceAll('rad_s','rad/s'),group:unit?.group||dimensionName(result.dim),constants:unit?.constants||[],value:result.value/reference.value,imag:(result.imag||0)/reference.value,prefixable:!!unit && !unit.prefix && prefixable.includes(target)};
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
    // Highlight independently of parsing so partially typed expressions remain usable.
    function highlightTokens(text) {
        const pattern=/(?:\d+(?:\.\d*)?|\.\d+)(?:E[+-]?\d+)?|[A-Za-zµ_][A-Za-z0-9µ_]*|[()]/g;
        const parts=[], parentheses=[]; let end=0, match, previousType='plain';
        while((match=pattern.exec(text))) {
            if(match.index>end) parts.push({text:text.slice(end,match.index),type:'plain'});
            const symbol=match[0];
            let type=symbol==='eq'?'operator':Object.hasOwn(FUNCTIONS,symbol)?'function':Object.hasOwn(U,symbol)?'unit':Object.hasOwn(constants,symbol)||['i','euler'].includes(symbol)?'constant':'plain';
            if(symbol==='(') {const isFunction=previousType==='function' && /^\s*$/.test(text.slice(end,match.index)); parentheses.push(isFunction); if(isFunction) type='function';}
            else if(symbol===')' && parentheses.pop()) type='function';
            parts.push({text:symbol,type}); previousType=symbol==='('||symbol===')'?'plain':type; end=pattern.lastIndex;
        }
        if(end<text.length) parts.push({text:text.slice(end),type:'plain'});
        return parts;
    }
    function completions(text, cursor) {
        const before=text.slice(0,cursor), token=before.match(/[A-Za-zµ_][A-Za-z0-9µ_]*$/);
        if(!token && /(?:^|\s)eq\s+$/.test(before)) {
            const common=['eV','J','Hz','rad_s','K','T','m','s'];
            return {start:cursor,end:cursor,items:common.map(symbol=>({...U[symbol],type:'unit'}))};
        }
        if(!token) return {start:cursor,end:cursor,items:[]};
        const unitItems=Object.values(U).map(u=>({symbol:u.symbol,name:u.name,type:'unit'}));
        const afterEq=/(?:^|\s)eq\s+[A-Za-zµ_][A-Za-z0-9µ_]*$/.test(before);
        const pool=afterEq?unitItems:[...constantItems(),...Object.entries(FUNCTIONS).map(([symbol,name])=>({symbol,name,type:'function'})),{symbol:'eq',name:'Convert result to a unit',type:'operator'},{symbol:'i',name:'Imaginary unit',type:'constant'},{symbol:'euler',name:'Euler number',type:'constant'},...unitItems];
        const items=searchItems(pool,token[0]);
        const remainder=text.slice(cursor).match(/^[A-Za-z0-9µ_]*/)[0];
        return {start:cursor-token[0].length,end:cursor+remainder.length,items};
    }
    function chooseDefault(result, text, choices) {
        const name=dimensionName(result.dim);
        const byKey=key=>choices.find(row=>row.key===key);
        const names=tokenize(text).filter(token=>token.type==='name').map(token=>token.value);
        // When the input already names a unit of the result's dimension, keep
        // that unit family. Prefixes are still selected from the result size.
        for(const symbol of names) {
            const unit=U[symbol]; if(!unit || !same(unit.dim,result.dim)) continue;
            const base=unit.base || symbol;
            const key={degC:'°C',degF:'°F',deltaC:'Δ°C',deltaF:'Δ°F'}[base] || base;
            if(byKey(key)) return key;
        }
        // Planck, Boltzmann and Bohr-magneton energies are commonly discussed
        // in electronvolts. Do not infer a field solely from the magnitude.
        if(name==='energy') {
            const quantum=new Set(['h','hbar','k_B','mu_B']);
            const energyConstant=names.some(symbol=>quantum.has(symbol) || /(?:planck_constant|boltzmann_constant|bohr_magneton)/i.test(symbol));
            if(energyConstant && byKey('eV')) return 'eV';
        }
        const preferred={energy:'J',frequency:'Hz',length:'m',area:'m²',volume:'m³',mass:'g',time:'s',temperature:'K',force:'N',power:'W','pressure / energy density':'Pa',charge:'C',voltage:'V',resistance:'ohm','magnetic flux density':'T',current:'A',amount:'mol',luminous:'cd',velocity:'m/s',acceleration:'m/s²',capacitance:'F',inductance:'H',conductance:'S','magnetic flux':'Wb'}[name];
        return byKey(preferred)?.key || choices[0]?.key || '';
    }
    function scaledChoice(choice) {
        const magnitude=Math.hypot(choice.value,choice.imag||0);
        if(!choice.prefixable || !magnitude) return {value:choice.value,imag:choice.imag||0,label:choice.label,power:0,prefix:''};
        const scales=[['Q',30],['R',27],['Y',24],['Z',21],['E',18],['P',15],['T',12],['G',9],['M',6],['k',3],['',0],['m',-3],['µ',-6],['n',-9],['p',-12],['f',-15],['a',-18],['z',-21],['y',-24],['r',-27],['q',-30]];
        const found=scales.find(([,power])=>magnitude/10**power>=1 && magnitude/10**power<1000);
        if(!found) return {value:choice.value,imag:choice.imag||0,label:choice.label,power:0,prefix:''};
        const [prefix,power]=found; return {value:choice.value/10**power,imag:(choice.imag||0)/10**power,label:prefix+choice.label,power,prefix};
    }
    function formatExpression(text) {return latex(parse(text).tree);}
    return {units:U,constants,functions:FUNCTIONS,dimensions:D,parse,evaluate,formatExpression,conversions,requestedConversion,dimensionName,searchItems,constantItems,highlightTokens,completions,chooseDefault,scaledChoice};
});
