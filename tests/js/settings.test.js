const test=require('node:test');
const assert=require('node:assert/strict');
const settings=require('../../assets/js/settings.js');
test('settings tolerate old, corrupted and unavailable preference values',()=>{
    assert.deepEqual(settings.normalize(null),settings.defaults);
    assert.deepEqual(settings.normalize({precision:100,keyboardLayout:'unknown',unitPrefixes:'false'}),settings.defaults);
    const value=settings.normalize({precision:'12',decimalSeparator:',',resultFormat:'engineering',unitPrefixes:false,keyboardLayout:'azerty',angleMode:'deg'});
    assert.equal(value.precision,12);assert.equal(value.unitPrefixes,false);assert.equal(value.keyboardLayout,'azerty');
});
test('calculator number formats support comma, significant digits and extreme values',()=>{
    assert.equal(settings.format(1.23456789), '1.23456789');
    assert.equal(settings.format(12345,{resultFormat:'scientific',precision:3}), '1.23E+4');
    assert.equal(settings.format(12345,{resultFormat:'engineering',precision:3,decimalSeparator:','}), '12,3E3');
    assert.equal(settings.format(0.00001234,{resultFormat:'decimal'}),'0.00001234');
    assert.equal(settings.format(1e-100,{resultFormat:'decimal'}),'0.'+'0'.repeat(99)+'1');
    assert.equal(settings.format(-0),'0');
    assert.equal(settings.format(999999,{resultFormat:'engineering',precision:3}),'1E6');
    assert.equal(settings.format(1.25,{decimalSeparator:','}),'1,25');
});
