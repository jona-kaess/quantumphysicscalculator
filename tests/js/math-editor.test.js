const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../../assets/js/physics-engine.js');
const math=require('../../assets/js/math-editor.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1e-300,Math.abs(b)*1e-12),`${a} != ${b}`);

test('math editor round trips expressions without changing physics',()=>{
    const cases=['hbar * 10 GHz','7/8','frac(1+2,3+3)','frac(1,frac(2,3))','sqrt(9 m^2)',
        'sin(pi/2)','2**3**2','1E6 + 2E-3','(2+3i)*2','5V / 10A','5V / 10 A',
        '20 degC - 10 degC','mu_B * 1 T','k_B * 300 K','1 fF/m^2','-2^2'];
    for(const source of cases) {
        const before=engine.evaluate(source),roundtrip=math.fromLatex(math.toLatex(source)),after=engine.evaluate(roundtrip);
        close(after.value,before.value);close(after.imag||0,before.imag||0);
        assert.deepEqual(after.dim,before.dim,source);
        assert.deepEqual(after.used,before.used,source);
    }
});
test('all constants and units have stable distinct editor symbols',()=>{
    for(const [symbol,c] of Object.entries(engine.constants)) {
        const latex=math.toLatex(symbol),parsed=math.fromLatex(latex);
        assert.equal(parsed,symbol);close(engine.evaluate(parsed).value,c.value);
    }
    for(const symbol of Object.keys(engine.units)) {
        const source='1 '+symbol;
        assert.equal(math.fromLatex(math.toLatex(source)),source);
    }
    assert.notEqual(math.toLatex('F'),math.toLatex('F_const'));
});
test('standard LaTeX fractions, powers and constants are accepted',()=>{
    assert.equal(math.fromLatex('\\frac{1+2}{3+3}'),'frac(1+2,3+3)');
    close(engine.evaluate(math.fromLatex('\\hbar\\cdot 10\\,\\mathrm{GHz}')).value,engine.evaluate('hbar * 10 GHz').value);
    close(engine.evaluate(math.fromLatex('\\sqrt{9} + 2^{3}')).value,11);
    assert.equal(math.fromLatex('\\mu_B'),'mu_B');
    assert.equal(math.fromLatex('\\frac{\\placeholder{}}{2}'),'frac(,2)');
    assert.throws(()=>math.fromLatex('\\unknown{1}'),/Unsupported math command/);
});
test('conversion suffixes survive mathematical editing',()=>{
    for(const source of ['300 K eq eV','1 eV eq GHz','1 m eq cm']) {
        const result=math.fromLatex(math.toLatex(source));
        assert.match(result,/\s+eq\s+/);
        const [expression,target]=result.split(/\s+eq\s+/);
        assert.ok(Number.isFinite(engine.requestedConversion(engine.evaluate(expression),target,expression).value));
    }
});

test('symbol boundaries, decimal commas and compound conversion targets remain unambiguous',()=>{
    const constant=math.symbolLatex('hbar','C');
    assert.equal(math.fromLatex(constant+'5'),'hbar 5');
    close(engine.evaluate(math.fromLatex(constant+'5')).value,engine.evaluate('hbar * 5').value);
    assert.equal(math.fromLatex('1{,}25\\cdot 2'),'1.25*2');
    assert.match(math.toLatex('1.25',{decimalSeparator:','}),/1\{,\}25/);
    const target=math.fromLatex(math.toLatex('gamma_e eq GHz/T'));
    const [expression,unit]=target.split(/\s+eq\s+/);
    close(engine.requestedConversion(engine.evaluate(expression),unit).value,engine.requestedConversion(engine.evaluate('gamma_e'),'GHz/T').value);
});
