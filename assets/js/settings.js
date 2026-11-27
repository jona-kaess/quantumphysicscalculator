/* Device-local preferences; calculations always retain their full precision. */
(function(root,factory) {
    if(typeof module==='object' && module.exports) module.exports=factory();
    else root.CalculatorSettings=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function() {
    const defaults={decimalSeparator:'.',resultFormat:'auto',precision:9,unitPrefixes:true,keyboardLayout:'qwertz',angleMode:'rad'};
    function normalize(value={}) {
        if(!value || typeof value!=='object')value={};
        return {
            decimalSeparator:value.decimalSeparator===','?',':'.',
            resultFormat:['auto','decimal','scientific','engineering'].includes(value.resultFormat)?value.resultFormat:'auto',
            precision:Number.isInteger(Number(value.precision)) && Number(value.precision)>=3 && Number(value.precision)<=15?Number(value.precision):9,
            unitPrefixes:typeof value.unitPrefixes==='boolean'?value.unitPrefixes:true,
            keyboardLayout:['qwertz','qwerty','azerty','dvorak'].includes(value.keyboardLayout)?value.keyboardLayout:'qwertz',
            angleMode:value.angleMode==='deg'?'deg':'rad'
        };
    }
    function decimal(text) {
        const [coefficient,power]=text.toLowerCase().split('e');
        if(power===undefined)return coefficient;
        const negative=coefficient.startsWith('-'),digits=coefficient.replace('-','').replace('.','');
        const point=(coefficient.replace('-','').split('.')[0].length)+Number(power);
        return (negative?'-':'')+(point<=0?'0.'+'0'.repeat(-point)+digits:point>=digits.length?digits+'0'.repeat(point-digits.length):digits.slice(0,point)+'.'+digits.slice(point));
    }
    function format(number,options=defaults) {
        const settings=normalize(options),precision=settings.precision;
        if(!Number.isFinite(number))return String(number);
        const rounded=Number(number.toPrecision(precision)),magnitude=Math.abs(rounded);
        let output;
        if(settings.resultFormat==='scientific' && rounded) output=rounded.toExponential();
        else if(settings.resultFormat==='engineering' && rounded) {
            const power=3*Math.floor(Math.log10(magnitude)/3);
            output=Number((rounded/10**power).toPrecision(precision))+'E'+power;
        } else if(settings.resultFormat==='decimal')output=decimal(rounded.toString());
        else if(magnitude && (magnitude<1e-2 || magnitude>=1e9))output=rounded.toExponential();
        else output=rounded.toString();
        return output.replace(/e([+-]?\d+)/,'E$1').replace('.',settings.decimalSeparator);
    }
    return {defaults,normalize,format};
});
