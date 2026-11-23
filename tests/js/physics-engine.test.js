const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../../app/static/js/physics-engine.js');
const close = (actual, expected) => assert.ok(Math.abs(actual-expected) <= Math.max(1e-300,Math.abs(expected)*1e-12), `${actual} != ${expected}`);
const convert = (result,label) => engine.conversions(result).find(x=>x.label===label).value;

test('arithmetic, precedence, implicit multiplication and scientific notation', () => {
    close(engine.evaluate('7/8').value,0.875);
    close(engine.evaluate('2(3+4)^2').value,98);
    close(engine.evaluate('-2^2').value,-4);
    close(engine.evaluate('1E6 + 2E-3').value,1000000.002);
    close(engine.evaluate('10GHz').value,1e10);
    assert.match(engine.evaluate('7/8').latex,/\\frac\{7\}\{8\}/);
    assert.match(engine.evaluate('1E6').latex,/10\^\{6\}/);
});
test('constants, dimensions, unit prefixes and energy equivalents', () => {
    const a=engine.evaluate('hbar * 10GHz'); close(a.value,6.62607015e-34/(2*Math.PI)*1e10);
    assert.equal(engine.dimensionName(a.dim),'energy'); assert.deepEqual(a.used,['hbar']);
    close(convert(engine.evaluate('1 eV'),'J'),1.602176634e-19);
    close(convert(engine.evaluate('10 GHz_energy'),'hertz via E = hν'),1e10);
    assert.deepEqual(engine.evaluate('10 GHz_energy').used,['h']);
    assert.deepEqual(engine.evaluate('532 nm_energy').used,['h','c']);
    assert.equal(engine.dimensionName(engine.evaluate('10 GHz').dim),'frequency');
    close(convert(engine.evaluate('1 J'),'nm via E = hc/λ'),6.62607015e-34*299792458*1e9);
    close(convert(engine.evaluate('532 nm_energy'),'nm via E = hc/λ'),532);
    assert.throws(()=>engine.evaluate('0 nm_energy'),/positive/);
    assert.equal(engine.dimensionName(engine.evaluate('2 kg * 9.81 m / s^2').dim),'force');
    assert.equal(engine.dimensionName(engine.evaluate('1 m/s').dim),'velocity');
    assert.deepEqual(engine.evaluate('h*hbar/e').used,['h','hbar','e']);
    close(convert(engine.evaluate('1 m/s'),'km/h'),3.6);
    close(convert(engine.evaluate('10 T_energy'),'tesla via E = μBB'),10);
    close(convert(engine.evaluate('10 K_energy'),'kelvin via E = kBT'),10);
    close(convert(engine.evaluate('10 rad_s_energy'),'rad/s via E = ħω'),10);
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
    assert.equal(Object.keys(engine.constants).filter(k=>k.startsWith('scipy_')).length,442);
    assert.ok(engine.conversions(engine.evaluate('1 J')).some(u=>u.label==='kcal'));
    assert.ok(engine.conversions(engine.evaluate('1 F')).some(u=>u.label==='nF'));
});
test('search ranks exact matches first and result defaults to a readable prefix', () => {
    const entries=[{symbol:'scipy_electron_mass',name:'electron mass'}, {symbol:'e',name:'Elementary charge'}, {symbol:'scipy_electron_mass_energy_equivalent',name:'electron mass energy equivalent'}];
    assert.equal(engine.searchItems(entries,'electron mass')[0].symbol,'scipy_electron_mass');
    assert.equal(engine.searchItems(entries,'e')[0].symbol,'e');
    const value=engine.evaluate('0.025 eV');
    assert.equal(engine.chooseDefault(value,'0.025 eV',engine.conversions(value)),'meV');
    assert.equal(engine.conversions(engine.evaluate('1 g')).filter(row=>['ug','mug','µg'].includes(row.label)).length,1);
});
test('every registered unit and constant parses and exposes a finite result', () => {
    for(const [key,u] of Object.entries(engine.units)) {const r=engine.evaluate(`1 ${key}`); assert.ok(Number.isFinite(r.value),key); assert.deepEqual(r.dim,u.dim,key);}
    for(const [key,c] of Object.entries(engine.constants)) {const r=engine.evaluate(key); close(r.value,c.value); assert.deepEqual(r.used,[key]);}
});
