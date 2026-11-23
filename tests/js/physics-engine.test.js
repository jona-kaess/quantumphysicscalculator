const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../assets/js/physics-engine.js');
const close = (actual, expected) => assert.ok(Math.abs(actual-expected) <= Math.max(1e-300,Math.abs(expected)*1e-12), `${actual} != ${expected}`);
const convert = (result,label) => engine.conversions(result).find(x=>x.label===label).value;

test('energy equivalences work in both directions with the right constants', () => {
    const request=(source,target)=>engine.requestedConversion(engine.evaluate(source),target,source);
    close(request('1 THz','eV').value,6.62607015e-34*1e12/1.602176634e-19);
    close(request('1 eV','Hz').value,1.602176634e-19/6.62607015e-34);
    close(request('1 rad_s','eV').value,1.0545718176461565e-34/1.602176634e-19);
    close(request('300 K','eV').value,300*1.380649e-23/1.602176634e-19);
    close(request('500 nm','eV').value,6.62607015e-34*299792458/500e-9/1.602176634e-19);
    assert.deepEqual(request('1 Hz','eV').constants,['h','e']);
    assert.deepEqual(request('1 rad_s','eV').constants,['hbar','e']);
    assert.throws(()=>request('-1 m','eV'),/positive/);
    assert.throws(()=>request('1 kg','eV'),/not compatible/);
    assert.equal(engine.highlightTokens('1 Hz eq eV').find(t=>t.text==='eq').type,'operator');
});

test('arithmetic, precedence, implicit multiplication and scientific notation', () => {
    close(engine.evaluate('7/8').value,0.875);
    close(engine.evaluate('2(3+4)^2').value,98);
    close(engine.evaluate('-2^2').value,-4);
    close(engine.evaluate('1E6 + 2E-3').value,1000000.002);
    close(engine.evaluate('10GHz').value,1e10);
    assert.match(engine.evaluate('7/8').latex,/\\frac\{7\}\{8\}/);
    assert.match(engine.evaluate('1E6').latex,/10\^\{6\}/);
});
test('scientific functions, powers, factorial, percent and modulo', () => {
    const cases=[['sqrt(9)',3],['sin(pi/2)',1],['cos(0)',1],['tan(pi/4)',1],['sinh(1)',Math.sinh(1)],['cosh(1)',Math.cosh(1)],['tanh(1)',Math.tanh(1)],['ln(euler)',1],['log(100)',2],['exp(1)',Math.E],['tenpow(3)',1000],['abs(-4)',4],['factorial(5)',120],['5!',120],['50%',0.5],['percent(50)',0.5],['mod(11,3)',2],['pow(2,3)',8],['recip(4)',0.25],['floor(1.8)',1],['ceil(1.2)',2],['asin(1)',Math.PI/2],['acos(1)',0],['atan(1)',Math.PI/4]];
    for(const [expression,expected] of cases) assert.ok(Math.abs(engine.evaluate(expression).value-expected)<1e-12,expression);
    assert.deepEqual(engine.evaluate('sqrt(9 m^2)').dim,engine.dimensions.length);
    assert.throws(()=>engine.evaluate('sin(1 m)'),/dimensionless/);
    assert.throws(()=>engine.evaluate('(-1)!'),/Factorial/);
    assert.throws(()=>engine.evaluate('mod(1,0)'),/zero/);
    assert.throws(()=>engine.evaluate('sqrt()'));
    assert.throws(()=>engine.evaluate('mod(1)'),/2 arguments/);
    assert.match(engine.evaluate('sin(pi)').latex,/\\color\{brown\}.*\\operatorname\{sin\}/);
    assert.match(engine.evaluate('sqrt(4 m^2)').latex,/\\color\{brown\}.*\\sqrt/);
});
test('radian and degree modes and explicit angle units', () => {
    const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-12,`${actual} != ${expected}`);
    near(engine.evaluate('sin(90)','deg').value,1);
    near(engine.evaluate('sin(pi/2)','rad').value,1);
    near(engine.evaluate('sin(90 deg)','deg').value,1);
    near(engine.evaluate('sin(90 deg)','rad').value,1);
    near(engine.evaluate('sin(45deg+45deg)','deg').value,1);
    near(engine.evaluate('sin(180deg/2)','deg').value,1);
    near(engine.evaluate('asin(1)','deg').value,90);
    near(engine.evaluate('arg(i)','deg').value,90);
    near(engine.evaluate('sinh(1)','deg').value,Math.sinh(1));
});
test('trigonometric cardinal zeros do not erase genuinely small values', () => {
    assert.equal(engine.evaluate('sin(360)','deg').value,0);
    assert.equal(engine.evaluate('sin(180)','deg').value,0);
    assert.equal(engine.evaluate('sin(2*pi)','rad').value,0);
    assert.equal(engine.evaluate('cos(90)','deg').value,0);
    assert.equal(engine.evaluate('sin(1E-16)','rad').value,1e-16);
    assert.ok(Math.abs(engine.evaluate('sin(pi+1E-12)','rad').value)>1e-13);
    assert.throws(()=>engine.evaluate('tan(90)','deg'),/zero/);
});
test('complex arithmetic, functions and units', () => {
    const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);
    let x=engine.evaluate('(1+2i)*(3-4i)'); near(x.value,11); near(x.imag,2);
    x=engine.evaluate('sqrt(-1)'); near(x.value,0); near(x.imag,1);
    x=engine.evaluate('ln(-1)'); near(x.value,0); near(x.imag,Math.PI);
    near(engine.evaluate('abs(3+4i)').value,5);
    near(engine.evaluate('re(3+4i)').value,3); near(engine.evaluate('im(3+4i)').value,4);
    near(engine.evaluate('Re(3+4i)').value,3); near(engine.evaluate('Im(3+4i)').value,4);
    near(engine.evaluate('Arg(i)','deg').value,90);
    near(engine.evaluate('conj(3+4i)').imag,-4);
    x=engine.evaluate('(1+2i)*V'); assert.equal(engine.dimensionName(x.dim),'voltage');
    const row=engine.conversions(x).find(v=>v.key==='V'); near(row.value,1); near(row.imag,2);
    assert.throws(()=>engine.evaluate('asin(i)'),/real argument/);
    assert.throws(()=>engine.evaluate('1/(0+0i)'),/zero/);
});
test('a unit attached to a denominator number stays in the denominator', () => {
    for (const expression of ['5V / 10A', '5V/10A', '5 V / 10A']) {
        const result=engine.evaluate(expression);
        close(result.value,0.5);
        assert.equal(engine.dimensionName(result.dim),'resistance');
        assert.match(result.latex,/\\frac\{.*\}\{10.*\\mathrm\{A\}.*\}/);
    }
    const spaced=engine.evaluate('5V / 10 A');
    close(spaced.value,0.5);
    assert.equal(engine.dimensionName(spaced.dim),'power');
    const power=engine.evaluate('5V / 10A^2');
    assert.deepEqual(power.dim,[2,1,-3,-3,0,0,0]);
    close(engine.evaluate('5V / -10A').value,-0.5);
    close(engine.evaluate('5V / 1E1A').value,0.5);
    assert.equal(engine.dimensionName(engine.evaluate('1/2m * 3s').dim),'composite quantity');
});
test('constants, dimensions, unit prefixes and energy equivalents', () => {
    const a=engine.evaluate('hbar * 10GHz'); close(a.value,6.62607015e-34/(2*Math.PI)*1e10);
    assert.equal(engine.dimensionName(a.dim),'energy'); assert.deepEqual(a.used,['hbar']);
    close(convert(engine.evaluate('1 eV'),'J'),1.602176634e-19);
    close(engine.conversions(engine.evaluate('10 GHz_energy')).find(x=>x.key==='Hz_energy').value,1e10);
    assert.deepEqual(engine.evaluate('10 GHz_energy').used,['h']);
    assert.deepEqual(engine.evaluate('532 nm_energy').used,['h','c']);
    assert.equal(engine.dimensionName(engine.evaluate('10 GHz').dim),'frequency');
    close(engine.conversions(engine.evaluate('1 J')).find(x=>x.key==='nm_energy').value,6.62607015e-34*299792458*1e9);
    close(engine.conversions(engine.evaluate('532 nm_energy')).find(x=>x.key==='nm_energy').value,532);
    assert.throws(()=>engine.evaluate('0 nm_energy'),/positive/);
    assert.equal(engine.dimensionName(engine.evaluate('2 kg * 9.81 m / s^2').dim),'force');
    assert.equal(engine.dimensionName(engine.evaluate('1 m/s').dim),'velocity');
    assert.deepEqual(engine.evaluate('h*hbar/e').used,['h','hbar','e']);
    close(convert(engine.evaluate('1 m/s'),'km/h'),3.6);
    close(engine.conversions(engine.evaluate('10 T_energy')).find(x=>x.key==='T_energy').value,10);
    close(engine.conversions(engine.evaluate('10 K_energy')).find(x=>x.key==='K_energy').value,10);
    close(engine.conversions(engine.evaluate('10 rad_s_energy')).find(x=>x.key==='rad_s_energy').value,10);
});
test('absolute temperatures and temperature differences', () => {
    let t=engine.evaluate('32 degF'); close(t.value,273.15); assert.ok(Math.abs(convert(t,'°C')) < 1e-10);
    t=engine.evaluate('20 degC - 10 degC'); close(t.value,10); close(convert(t,'Δ°F'),18);
    assert.equal(engine.conversions(t).some(x=>x.label==='°C'),false);
    close(engine.evaluate('2 deltaF').value,10/9);
    assert.throws(()=>engine.evaluate('20 degC * 2'),/Absolute/);
    assert.throws(()=>engine.evaluate('20 degC + 10 degC'),/absolute temperatures/);
    assert.throws(()=>engine.evaluate('(-300) degC'),/below zero/);
    close(engine.evaluate('20 degC + 10 deltaC').value,303.15);
});
test('invalid input fails safely and descriptively', () => {
    for (const x of ['1 m + 1 s','1/0','1E','unknown','2 +','globalThis.alert(1)','2 $ 3']) assert.throws(()=>engine.evaluate(x),x);
    assert.throws(()=>engine.evaluate('1 m + 1 s'),/different dimensions/);
    assert.throws(()=>engine.evaluate('1/0'),/zero/);
});
test('extended units, SI prefixes and SciPy constants', () => {
    close(engine.evaluate('1 gauss').value,1e-4);
    close(engine.evaluate('1 F').value,1);
    assert.deepEqual(engine.evaluate('1 F').dim,[-2,-1,4,2,0,0,0]);
    close(engine.evaluate('1 kcal').value,4184);
    close(engine.evaluate('1 mm').value,1e-3);
    close(engine.evaluate('1 ml').value,1e-6);
    close(engine.evaluate('1 mug').value,1e-9);
    close(engine.evaluate('scipy_electron_mass').value,9.1093837015e-31);
    assert.deepEqual(engine.evaluate('scipy_electron_mass').dim,engine.dimensions.mass);
    assert.equal(Object.keys(engine.constants).filter(k=>k.startsWith('scipy_')).length,0);
    assert.ok(engine.conversions(engine.evaluate('1 J')).some(u=>u.label==='cal'));
    assert.ok(engine.conversions(engine.evaluate('1 F')).some(u=>u.label==='F'));
    assert.equal(engine.units.GHz.base,'Hz');
    assert.deepEqual(engine.evaluate('10 GHz').usedPrefixes,[{symbol:'G',power:9}]);
});
test('recognizes additional physical dimensions and their output units', () => {
    const cases=[['1 F','capacitance','F'], ['1 H','inductance','H'], ['1 S','conductance','S'],
        ['1 T','magnetic flux density','T'], ['1 Wb','magnetic flux','Wb'],
        ['1 V/m','electric field strength','V/m'], ['1 m^3','volume','m³'],
        ['1 F/m','permittivity','F/m'], ['1 kg/m^3','mass density','kg/m³'],
        ['1 J/m^3','pressure / energy density','J/m³']];
    for(const [expression,name,unit] of cases) {const result=engine.evaluate(expression); assert.equal(engine.dimensionName(result.dim),name,expression); assert.ok(engine.conversions(result).some(x=>x.label===unit),expression);}
});
test('imperial and US customary units have distinct, correct conversion factors', () => {
    close(engine.evaluate('1 in').value,0.0254);
    close(engine.evaluate('1 gal_US').value,0.003785411784);
    close(engine.evaluate('1 gal_UK').value,0.00454609);
    close(engine.evaluate('8 pt_US').value,engine.evaluate('1 gal_US').value);
    close(engine.evaluate('8 pt_UK').value,engine.evaluate('1 gal_UK').value);
    close(engine.evaluate('1 mph').value,0.44704);
    close(engine.evaluate('1 acre').value,4046.8564224);
    close(engine.evaluate('1 lbf').value,4.4482216152605);
    assert.ok(engine.conversions(engine.evaluate('1 L')).some(x=>x.label==='gal_US'));
    assert.ok(engine.conversions(engine.evaluate('1 L')).some(x=>x.label==='gal_UK'));
});
test('search ranks exact matches first and result defaults to a readable prefix', () => {
    const entries=[{symbol:'scipy_electron_mass',name:'electron mass'}, {symbol:'e',name:'Elementary charge'}, {symbol:'scipy_electron_mass_energy_equivalent',name:'electron mass energy equivalent'}];
    assert.equal(engine.searchItems(entries,'electron mass')[0].symbol,'scipy_electron_mass');
    assert.equal(engine.searchItems(entries,'e')[0].symbol,'e');
    const value=engine.evaluate('0.025 eV');
    assert.equal(engine.chooseDefault(value,'0.025 eV',engine.conversions(value)),'eV');
    assert.equal(engine.scaledChoice(engine.conversions(value).find(row=>row.key==='eV')).label,'meV');
    assert.equal(engine.conversions(engine.evaluate('1 g')).filter(row=>['ug','mug','µg'].includes(row.label)).length,0);
    const hz=engine.conversions(engine.evaluate('hbar*10GHz')).find(row=>row.key==='Hz_energy');
    assert.equal(engine.scaledChoice(hz).label,'GHz');
    close(engine.scaledChoice(hz).value,1.5915494309189535);
    assert.equal(hz.via,'E = h\\nu');
    assert.equal(engine.units.kg.base,'g');
    assert.deepEqual(engine.evaluate('10 kg').usedPrefixes,[{symbol:'k',power:3}]);
    close(engine.evaluate('m_e').value,engine.evaluate('scipy_electron_mass').value);
    close(engine.evaluate('epsilon_0').value,engine.evaluate('scipy_vacuum_electric_permittivity').value);
    assert.equal(engine.searchItems([{symbol:'scipy_electron_mass_energy_equivalent',name:'electron mass energy equivalent'}, {symbol:'m_e',name:'electron mass',keywords:'scipy_electron_mass'}],'scipy_electron_mass')[0].symbol,'m_e');
});
test('live completions include short constants and base units, preserve token bounds', () => {
    const constant=engine.completions('2 * hb',6);
    assert.equal(constant.items[0].symbol,'hbar');
    assert.equal(constant.start,4);
    assert.equal(constant.end,6);
    const middle=engine.completions('hbar + 1',2);
    assert.equal(middle.start,0); assert.equal(middle.end,4);
    const unit=engine.completions('10GH',4);
    assert.ok(unit.items.some(item=>item.symbol==='GHz'));
    const list=engine.completions('H',1).items;
    assert.ok(list.some(item=>item.symbol==='Hz'));
    assert.ok(list.some(item=>item.symbol==='GHz'));
    assert.equal(engine.searchItems([{symbol:'MHz',name:'megahertz'}, {symbol:'mHz',name:'millihertz'}],'mHz')[0].symbol,'mHz');
    assert.deepEqual(engine.completions('1 + ',4).items,[]);
});
test('input highlighting recognizes symbols even in incomplete expressions', () => {
    const parts=engine.highlightTokens('sqrt(hbar * 10GHz) + sin(1E6');
    const find=text=>parts.find(part=>part.text===text);
    assert.equal(find('sqrt').type,'function');
    assert.equal(find('hbar').type,'constant');
    assert.equal(find('GHz').type,'unit');
    assert.equal(find('sin').type,'function');
    assert.equal(find('1E6').type,'plain');
    assert.equal(parts.map(part=>part.text).join(''),'sqrt(hbar * 10GHz) + sin(1E6');
    assert.equal(engine.highlightTokens('e euler i').filter(p=>p.type==='constant').length,3);
    assert.deepEqual(engine.highlightTokens('sqrt(1) + (2)').filter(p=>p.text==='(' || p.text===')').map(p=>p.type),['function','function','plain','plain']);
    assert.deepEqual(engine.highlightTokens('1E6sin((pi))+(hbar)').filter(p=>p.text==='(' || p.text===')').map(p=>p.type),['function','plain','plain','function','plain','plain']);
    assert.deepEqual(engine.highlightTokens('sin + (pi) + sin (pi)').filter(p=>p.text==='(' || p.text===')').map(p=>p.type),['plain','plain','function','function']);
    assert.deepEqual(engine.highlightTokens('hbar*sin((2*pi)) + hbar*(2*pi)').filter(p=>p.text==='(' || p.text===')').map(p=>p.type),['function','plain','plain','function','plain','plain']);
    assert.deepEqual(engine.highlightTokens('sin(cos(pi) + (pi)').filter(p=>p.text==='(' || p.text===')').map(p=>p.type),['function','function','function','plain','plain']);
    assert.equal(engine.highlightTokens('<script>')[1].type,'plain');
});
test('LaTeX scopes constant and unit colors to their own symbols', () => {
    assert.equal(engine.evaluate('hbar*sin((2*pi)) + hbar*(2*pi)').latex,'{\\color{purple}\\hbar} \\cdot {\\color{brown}\\operatorname{sin}\\left({\\color{black}\\left(2 \\cdot {\\color{purple}\\pi}\\right)}\\right)} + {\\color{purple}\\hbar} \\cdot \\left(2 \\cdot {\\color{purple}\\pi}\\right)');
    assert.match(engine.evaluate('2 m + 3 m').latex,/\{\\color\{teal\}\\mathrm\{m\}\} \+ 3\\, \{\\color\{teal\}\\mathrm\{m\}\}/);
});
test('every registered unit and constant parses and exposes a finite result', () => {
    for(const [key,u] of Object.entries(engine.units)) {const r=engine.evaluate(`1 ${key}`); assert.ok(Number.isFinite(r.value),key); assert.deepEqual(r.dim,u.dim,key);}
    for(const [key,c] of Object.entries(engine.constants)) {const r=engine.evaluate(key); close(r.value,c.value); assert.deepEqual(r.used,[key]);}
});
test('formatting and defaults for units and equivalent choices', () => {
    assert.match(engine.evaluate('20 degC').latex,/\^\\circ/);
    assert.match(engine.evaluate('1 ohm').latex,/\\Omega/);
    for(const [expression,unit] of [['1 m^2','m²'],['1 m^3','m³']]) {const result=engine.evaluate(expression), choices=engine.conversions(result); assert.equal(engine.chooseDefault(result,expression,choices),unit);}
    const e=engine.conversions(engine.evaluate('1 J')); assert.ok(e.some(u=>u.key==='T_energy' && u.label==='T'));
    close(engine.evaluate('electron_mass').value,engine.evaluate('scipy_electron_mass').value);
});
test('curated constants use distinct symbols and reject unlisted entries', () => {
    const items=engine.completions('gyro',4).items;
    for(const symbol of ['gamma_e','gamma_p','gamma_n']) {
        assert.ok(items.some(item=>item.symbol===symbol),symbol);
        assert.match(engine.evaluate(symbol).latex,/\\gamma/);
        assert.ok(Number.isFinite(engine.evaluate(symbol).value));
    }
    assert.throws(()=>engine.evaluate('scipy_electron_mass_energy_equivalent'),/Unknown symbol/);
    assert.ok(!engine.constantItems().some(item=>item.symbol.startsWith('scipy_')));
    close(engine.evaluate('electron_mass').value,engine.evaluate('m_e').value);
    for(const symbol of Object.keys(engine.constants)) assert.ok(!engine.units[symbol],`unit collision: ${symbol}`);
});
