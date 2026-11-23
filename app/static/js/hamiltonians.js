(() => {
    const models = {
        single: {
            description: 'An effective spin-½ model used for spin, charge, flux and other two-level qubits.',
            formula: String.raw`\( H/h = \frac{1}{2}(\Delta\sigma_x + \epsilon\sigma_z) \)`,
            params: [ ['delta', 'Δ — transverse splitting (GHz)', 2, 0, 6], ['epsilon', 'ε — detuning (GHz)', 1, -6, 6] ],
            eigenvalues: p => { const e = Math.hypot(p.delta, p.epsilon) / 2; return [-e, e]; }
        },
        coupled: {
            description: 'Two two-level qubits with transverse XX coupling, a standard effective model for interacting qubits.',
            formula: String.raw`\( H/h = \frac{\omega_1}{2}\sigma_z^{(1)} + \frac{\omega_2}{2}\sigma_z^{(2)} + g\sigma_x^{(1)}\sigma_x^{(2)} \)`,
            params: [ ['w1', 'ω₁ — qubit 1 frequency (GHz)', 5, 0, 10], ['w2', 'ω₂ — qubit 2 frequency (GHz)', 5.5, 0, 10], ['g', 'g — coupling (GHz)', 0.3, -2, 2] ],
            eigenvalues: p => { const a = Math.hypot((p.w1 + p.w2) / 2, p.g), b = Math.hypot((p.w1 - p.w2) / 2, p.g); return [-a, -b, b, a]; }
        },
        transmon: {
            description: 'A superconducting qubit described by Josephson and charging energies. The lowest four levels are shown.',
            formula: String.raw`\( H/h = 4E_C(n-n_g)^2 - E_J\cos\varphi,\quad [\varphi,n]=i \)`,
            params: [ ['ej', 'EJ/h — Josephson energy (GHz)', 15, 0, 30], ['ec', 'EC/h — charging energy (GHz)', 0.3, 0.05, 1], ['ng', 'ng — offset charge (2e units)', 0, -1, 1] ],
            note: 'Numerical diagonalization uses 31 charge states (n = −15 … 15); accuracy can decrease outside the displayed default ranges.',
            eigenvalues: p => {
                const n = 31, a = Array.from({length:n}, () => Array(n).fill(0));
                for (let i=0; i<n; i++) { a[i][i] = 4*p.ec*(i-15-p.ng)**2; if (i+1<n) a[i][i+1] = a[i+1][i] = -p.ej/2; }
                // Jacobi rotations for a real symmetric matrix.
                for (let iter=0; iter<5000; iter++) {
                    let max=0, x=0, y=1;
                    for (let i=0; i<n; i++) for (let j=i+1; j<n; j++) if (Math.abs(a[i][j])>max) { max=Math.abs(a[i][j]); x=i; y=j; }
                    if (max<1e-10) break;
                    const angle=0.5*Math.atan2(2*a[x][y], a[y][y]-a[x][x]), c=Math.cos(angle), s=Math.sin(angle);
                    const xx=a[x][x], yy=a[y][y], xy=a[x][y];
                    for (let k=0; k<n; k++) if (k!==x && k!==y) { const kx=a[k][x], ky=a[k][y]; a[k][x]=a[x][k]=c*kx-s*ky; a[k][y]=a[y][k]=s*kx+c*ky; }
                    a[x][x]=c*c*xx-2*s*c*xy+s*s*yy; a[y][y]=s*s*xx+2*s*c*xy+c*c*yy; a[x][y]=a[y][x]=0;
                }
                return a.map((row,i)=>row[i]).sort((a,b)=>a-b).slice(0,4);
            }
        }
    };
    const $ = id => document.getElementById(id);
    const colors = ['#1366d6','#d14b38','#16865b','#9a54b8'];
    let model;
    function setup() {
        model = models[$('model').value];
        $('model-description').textContent = model.description;
        $('hamiltonian-formula').textContent = model.formula;
        if (window.MathJax?.typesetPromise) { MathJax.typesetClear([$('hamiltonian-formula')]); MathJax.typesetPromise([$('hamiltonian-formula')]); }
        $('model-note').textContent = model.note || '';
        $('parameters').replaceChildren(); $('sweep').replaceChildren();
        model.params.forEach(([key,label,value]) => {
            const wrap=document.createElement('div'), lab=document.createElement('label'), input=document.createElement('input'), option=document.createElement('option');
            lab.htmlFor=`param-${key}`; lab.textContent=label; input.id=lab.htmlFor; input.type='number'; input.step='any'; input.value=value;
            input.addEventListener('input', draw); wrap.append(lab,input); $('parameters').append(wrap);
            option.value=key; option.textContent=label; $('sweep').append(option);
        });
        updateRange();
    }
    function updateRange() {
        const p=model.params.find(p=>p[0]===$('sweep').value);
        $('sweep-min').value=p[3]; $('sweep-max').value=p[4]; draw();
    }
    function draw() {
        const values=Object.fromEntries(model.params.map(([key])=>[key, Number($(`param-${key}`).value)]));
        const fields=model.params.map(([key])=>$(`param-${key}`));
        const min=Number($('sweep-min').value), max=Number($('sweep-max').value), key=$('sweep').value;
        if ([...fields,$('sweep-min'),$('sweep-max')].some(el=>el.value.trim()==='' || !Number.isFinite(Number(el.value))) || min>=max) {
            $('plot-error').textContent='Enter finite parameter values and a sweep range with From smaller than To.'; $('energy-plot').replaceChildren(); $('levels').replaceChildren(); return;
        }
        if ($('model').value==='transmon' && (values.ec<=0 || values.ej<0 || (key==='ec' && min<=0) || (key==='ej' && min<0))) {
            $('plot-error').textContent='For the transmon, EC must be positive and EJ must be non-negative throughout the sweep.'; $('energy-plot').replaceChildren(); $('levels').replaceChildren(); return;
        }
        $('plot-error').textContent='';
        const current=model.eigenvalues(values), samples=Array.from({length:101},(_,i)=>model.eigenvalues({...values,[key]:min+(max-min)*i/100}));
        const all=samples.flat(), lo=Math.min(...all), hi=Math.max(...all), pad=(hi-lo)*0.08 || 1, ymin=lo-pad, ymax=hi+pad;
        const x=v=>75+(v-min)/(max-min)*650, y=v=>350-(v-ymin)/(ymax-ymin)*310;
        const svg=$('energy-plot'); svg.replaceChildren();
        function add(tag, attrs, text) { const e=document.createElementNS('http://www.w3.org/2000/svg',tag); Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); if(text!==undefined)e.textContent=text; svg.append(e); return e; }
        for(let i=0;i<=5;i++) {
            const yy=40+i*62, val=ymax-(ymax-ymin)*i/5;
            add('line',{x1:75,y1:yy,x2:725,y2:yy,stroke:'#e1e8f2'}); add('text',{x:65,y:yy+4,'text-anchor':'end',class:'axis-text'},val.toPrecision(3));
            const xx=75+i*130; add('text',{x:xx,y:372,'text-anchor':'middle',class:'axis-text'},(min+(max-min)*i/5).toPrecision(3));
        }
        add('line',{x1:75,y1:40,x2:75,y2:350,stroke:'#7990ab'}); add('line',{x1:75,y1:350,x2:725,y2:350,stroke:'#7990ab'});
        add('text',{x:15,y:195,transform:'rotate(-90 15 195)','text-anchor':'middle',class:'axis-text'},'E/h (GHz)');
        add('text',{x:400,y:396,'text-anchor':'middle',class:'axis-text'},model.params.find(p=>p[0]===key)[1]);
        if(values[key]>=min && values[key]<=max) add('line',{x1:x(values[key]),y1:40,x2:x(values[key]),y2:350,stroke:'#6b7280','stroke-dasharray':'5 5'});
        current.forEach((v,i)=>add('polyline',{points:samples.map((s,j)=>`${x(min+(max-min)*j/100)},${y(s[i])}`).join(' '),fill:'none',stroke:colors[i],'stroke-width':2.5}));
        $('levels').replaceChildren(); current.forEach((v,i)=>{const el=document.createElement('span'); el.style.color=colors[i]; el.textContent=`E${i}/h = ${v.toPrecision(6)} GHz`; $('levels').append(el);});
    }
    $('model').addEventListener('change',setup); $('sweep').addEventListener('change',updateRange);
    $('sweep-min').addEventListener('input',draw); $('sweep-max').addEventListener('input',draw); setup();
})();
