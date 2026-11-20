/* Additional MeanMedianLab experiments: frustums, quadratic sections, and balance.
 * All heights and distributions are normalized to 0 <= u <= 1.
 * Pure mathematical functions are also exported to Node for testing. */
(function (root) {
  'use strict';

  const OPTIMAL_RATIO = 0.2676280512066448;
  const SHARP_GAP_3D = 0.0518931672000759;
  const clamp = x => Math.max(0, Math.min(1, x));

  function polyProfile(coeffs) {
    const integral = (order, x) => coeffs.reduce((sum, c, j) =>
      sum + c * Math.pow(x, j + order + 1) / (j + order + 1), 0);
    const mass = integral(0, 1);
    if (!(mass > 0)) throw new RangeError('Sectional area must have positive integral.');
    const area = u => coeffs.reduce((sum, c, j) => sum + c * Math.pow(u, j), 0);
    const cdf = u => integral(0, clamp(u)) / mass;
    const partialFirst = u => integral(1, clamp(u)) / mass;
    const mean = integral(1, 1) / mass;
    const secondMoment = integral(2, 1) / mass;
    let lo = 0, hi = 1;
    for (let j = 0; j < 60; j++) {
      const mid = (lo + hi) / 2;
      if (cdf(mid) < 0.5) lo = mid;
      else hi = mid;
    }
    const median = (lo + hi) / 2;
    return { area, pdf: u => area(clamp(u)) / mass, cdf, partialFirst,
      mean, median, secondMoment, fractionBelowMean: cdf(mean) };
  }

  function powerProfile(p) {
    if (!Number.isFinite(p) || p < 0) throw new RangeError('p must be nonnegative.');
    const mean = (p + 1) / (p + 2);
    const median = Math.exp(-Math.LN2 / (p + 1));
    const cdf = u => Math.pow(clamp(u), p + 1);
    return {
      area: u => Math.pow(clamp(u), p),
      pdf: u => (p + 1) * Math.pow(clamp(u), p),
      cdf,
      partialFirst: u => mean * Math.pow(clamp(u), p + 2),
      mean, median, secondMoment: (p + 1) / (p + 3),
      fractionBelowMean: cdf(mean)
    };
  }

  function frustumProfile(kappa) {
    if (!Number.isFinite(kappa) || kappa < 0 || kappa > 1) {
      throw new RangeError('The radius ratio must lie in [0, 1].');
    }
    const d = 1 - kappa;
    return polyProfile([kappa*kappa, 2*kappa*d, d*d]);
  }

  function quadraticProfile(lower, middle, upper) {
    if (![lower, middle, upper].every(Number.isFinite) ||
        lower <= 0 || middle < 0 || upper <= 0) {
      throw new RangeError('Endpoint controls must be positive and middle control nonnegative.');
    }
    // Bernstein form guarantees a positive sectional area on [0,1].
    return polyProfile([lower, 2 * (middle - lower), lower - 2 * middle + upper]);
  }

  function cubicCounterexample() { return polyProfile([2, -1, -5, 7]); }

  function absoluteLoss(profile, a) {
    if (!Number.isFinite(a) || a < 0 || a > 1) throw new RangeError('a must lie in [0,1].');
    return profile.mean - 2*profile.partialFirst(a) + a*(2*profile.cdf(a) - 1);
  }
  function quadraticLoss(profile, a) {
    if (!Number.isFinite(a) || a < 0 || a > 1) throw new RangeError('a must lie in [0,1].');
    return profile.secondMoment - 2*a*profile.mean + a*a;
  }

  const api = Object.freeze({OPTIMAL_RATIO, SHARP_GAP_3D, powerProfile,
    frustumProfile, quadraticProfile, cubicCounterexample, absoluteLoss, quadraticLoss});
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MeanMedianExtensions = api;
  if (typeof document === 'undefined') return;

  const BLUE = '#76c8f2', ORANGE = '#f7af7a', PALE = '#d7e3ec';
  const fmt = (x, n = 4) => x.toFixed(n);
  const pText = x => (100*x).toFixed(2) + '%';

  function densityChart(profile, title) {
    const x0 = 46, x1 = 646, y0 = 220, y1 = 31;
    const x = u => x0+(x1-x0)*u;
    const maxPdf = Math.max(1e-6, ...Array.from({length: 201}, (_,j) => profile.pdf(j/200)))*1.13;
    const y = f => y0-(y0-y1)*f/maxPdf;
    const points = Array.from({length: 241}, (_,j) => {
      const u=j/240; return `${j?'L':'M'} ${fmt(x(u),2)} ${fmt(y(profile.pdf(u)),2)}`;
    }).join(' ');
    const shade = Array.from({length: 121}, (_,j) => {
      const u=profile.median*j/120;
      return `L ${fmt(x(u),2)} ${fmt(y(profile.pdf(u)),2)}`;
    }).join(' ');
    const ticks = [0, .25, .5, .75, 1].map(u => `<line x1="${x(u)}" y1="${y1}" x2="${x(u)}" y2="${y0}" stroke="#263b4b"/><text x="${x(u)}" y="241" text-anchor="middle" fill="#a1b0c1" font-size="12">${fmt(u,2)}</text>`).join('');
    const markers = [
      [profile.mean, ORANGE, 'Mean'], [profile.median, BLUE, 'Median']
    ].map(([u,color,label]) => `<line x1="${x(u)}" y1="${y1}" x2="${x(u)}" y2="${y0}" stroke="${color}" stroke-width="2" stroke-dasharray="5 4"/>`).join('');
    return `<svg viewBox="0 0 680 262" role="img" aria-label="${title}: density, mean and median">
      <title>${title}: normalized density</title><desc>The blue line is the median, the orange line the mean. Shading covers half the volume.</desc>
      ${ticks}<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#b2c4d5"/>
      <path d="M ${x(0)} ${y0} ${shade} L ${x(profile.median)} ${y0} Z" fill="rgba(118,200,242,.18)"/>
      <path d="${points}" stroke="${PALE}" stroke-width="2.5" fill="none"/>
      ${markers}<text x="346" y="259" font-size="12" fill="#a1b0c1" text-anchor="middle">Normalized height u = z/H</text></svg>`;
  }

  function gapChart(qCurrent) {
    const x0=48,x1=645,y0=210,y1=32,max=0.058;
    const x=q=>x0+(x1-x0)*q, y=g=>y0-(y0-y1)*g/max;
    const gap=q=>{const p=frustumProfile(q);return p.median-p.mean;};
    const curve=Array.from({length:201},(_,j)=>{
      const q=j/200;return `${j?'L':'M'} ${fmt(x(q),2)} ${fmt(y(gap(q)),2)}`;
    }).join(' ');
    const marker=(q,color)=>`<circle cx="${x(q)}" cy="${y(gap(q))}" r="5" fill="${color}" stroke="#08121d" stroke-width="2"/>`;
    return `<svg viewBox="0 0 680 248" role="img" aria-label="Mean–median separation for frustums, showing the sharp maximum">
      <title>Separation versus end-radius ratio</title>
      <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y0}" stroke="#b2c4d5"/>
      <line x1="${x(OPTIMAL_RATIO)}" y1="${y1}" x2="${x(OPTIMAL_RATIO)}" y2="${y0}" stroke="${BLUE}" stroke-dasharray="4 5"/>
      <line x1="${x0}" y1="${y(SHARP_GAP_3D)}" x2="${x1}" y2="${y(SHARP_GAP_3D)}" stroke="${BLUE}" stroke-dasharray="4 5" opacity=".5"/>
      <path d="${curve}" fill="none" stroke="#e1edf8" stroke-width="3"/>
      ${marker(qCurrent,ORANGE)}${marker(OPTIMAL_RATIO,BLUE)}
      <text x="${x0}" y="23" fill="#a1b0c1" font-size="13">(m − mean)/H</text>
      <text x="${x(OPTIMAL_RATIO)+10}" y="48" fill="${BLUE}" font-size="12">maximum</text>
      ${[0,.25,.5,.75,1].map(q=>`<text x="${x(q)}" y="233" text-anchor="middle" fill="#a1b0c1" font-size="12">${fmt(q,2)}</text>`).join('')}
      <text x="346" y="247" text-anchor="middle" font-size="12" fill="#a1b0c1">Small / large radius ratio κ</text></svg>`;
  }

  function lossChart(profile, objective, minimum, chosen, title, color) {
    const x0=39,x1=644,y0=195,y1=21, x=u=>x0+(x1-x0)*u;
    const values=Array.from({length:201},(_,j)=>objective(profile,j/200));
    const low=Math.min(...values), high=Math.max(...values);
    const y=v=>y0-(y0-y1)*(v-low)/(high-low || 1);
    const curve=values.map((v,j)=>`${j?'L':'M'} ${fmt(x(j/200),2)} ${fmt(y(v),2)}`).join(' ');
    return `<svg viewBox="0 0 680 235" role="img" aria-label="${title}, minimized at ${fmt(minimum)}">
      <title>${title}</title><line x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}" stroke="#b2c4d5"/>
      <path d="${curve}" fill="none" stroke="${color}" stroke-width="3"/>
      <line x1="${x(minimum)}" x2="${x(minimum)}" y1="${y1}" y2="${y0}" stroke="${color}" stroke-dasharray="5 5" opacity=".8"/>
      <line x1="${x(chosen)}" x2="${x(chosen)}" y1="${y1}" y2="${y0}" stroke="#fff" stroke-dasharray="3 4"/>
      <circle cx="${x(chosen)}" cy="${y(objective(profile,chosen))}" r="6" fill="#fff" stroke="#08121d" stroke-width="2"/>
      ${[0,.25,.5,.75,1].map(q=>`<text x="${x(q)}" y="220" text-anchor="middle" fill="#a1b0c1" font-size="12">${fmt(q,2)}</text>`).join('')}</svg>`;
  }

  function metricHTML(profile) {
    return `<div class="lab-metrics" aria-live="polite">
      <div class="stat mean"><span class="stat-label">Centroid / mean</span><strong class="stat-value">${fmt(profile.mean)} H</strong></div>
      <div class="stat median"><span class="stat-label">Volume bisector / median</span><strong class="stat-value">${fmt(profile.median)} H</strong></div>
      <div class="stat"><span class="stat-label">Signed separation / H</span><strong class="stat-value">${fmt(profile.median-profile.mean,5)}</strong></div>
      <div class="stat"><span class="stat-label">Volume below centroid</span><strong class="stat-value">${pText(profile.fractionBelowMean)}</strong></div>
    </div>`;
  }

  function setup() {
    const target=document.getElementById('extended-labs');
    if(!target) return;
    target.innerHTML=`
    <nav class="lab-navigation" aria-label="Experiments"><span>Explore</span>
      <a href="#power-law-lab">Power laws</a><a href="#frustum-lab">Sharp frustum</a>
      <a href="#quadratic-lab">Quadratic sections</a><a href="#mechanics-lab">Mechanics of balance</a>
    </nav>
    <section class="panel lab-section" id="frustum-lab" aria-labelledby="frustum-title">
      <p class="lab-kicker">02 / The sharp geometric bound</p><h2 id="frustum-title">Why the cone is not extremal</h2>
      <p>Start with a cone and remove its tip. The remaining frustum has lower-to-upper radius ratio κ. Its sectional area is proportional to <strong>[κ + (1 − κ)u]²</strong>, where u = z/H.</p>
      <div class="lab-slider-row"><label for="frustum-kappa">Radius ratio κ</label><input id="frustum-kappa" type="range" min="0" max="1" step="0.000001" value="0.267628"><output id="frustum-kappa-out" for="frustum-kappa">0.267628</output></div>
      <div class="presets"><button type="button" data-frustum="0">Full cone</button><button type="button" data-frustum="optimal">Extremal frustum</button><button type="button" data-frustum="1">Cylinder</button></div>
      <div id="frustum-metrics"></div>
      <div class="lab-chart-grid">
        <figure class="lab-chart"><h3>Height density</h3><div id="frustum-density"></div><figcaption>Blue shade: half the volume. The median is blue and the centroid is orange.</figcaption></figure>
        <figure class="lab-chart"><h3>Separation across frustums</h3><div id="frustum-gap"></div><figcaption>Orange: current frustum. Blue: the sharp maximum.</figcaption></figure>
      </div>
      <p class="lab-insight" id="frustum-insight" aria-live="polite"></p>
      <p class="lab-equation">For all homogeneous convex solids in three dimensions, |m − mean|/H ≤ <strong>0.0518931672…</strong>. A frustum with κ ≈ 0.267628 attains equality.</p>
    </section>
    <section class="panel lab-section" id="quadratic-lab" aria-labelledby="quadratic-title">
      <p class="lab-kicker">03 / Sectional area and ordering</p><h2 id="quadratic-title">Can the end sections predict which plane is higher?</h2>
      <p>Choose a positive quadratic sectional area in Bernstein form: <strong>A(u) = a(1 − u)² + 2bu(1 − u) + cu²</strong>. Its lower and upper end areas are a and c. Even when the area first decreases and then increases, their ordering determines the sign of m − mean.</p>
      <div class="lab-three-sliders" id="quadratic-controls">
        <div><label for="quadratic-a">Lower end a</label><input id="quadratic-a" type="range" min="0.1" max="4" step="0.05" value="0.4"><output id="quadratic-a-out" for="quadratic-a">0.40</output></div>
        <div><label for="quadratic-b">Middle control b</label><input id="quadratic-b" type="range" min="0" max="4" step="0.05" value="0"><output id="quadratic-b-out" for="quadratic-b">0.00</output></div>
        <div><label for="quadratic-c">Upper end c</label><input id="quadratic-c" type="range" min="0.1" max="4" step="0.05" value="2"><output id="quadratic-c-out" for="quadratic-c">2.00</output></div>
      </div>
      <div class="presets"><button type="button" data-quad="widen">Wider at top</button><button type="button" data-quad="reverse">Wider at bottom</button><button type="button" data-quad="symmetric">Symmetric hourglass</button><button type="button" data-quad="cubic">Cubic counterexample</button></div>
      <div id="quadratic-metrics"></div>
      <figure class="lab-chart"><h3>Sectional-area density</h3><div id="quadratic-density"></div><figcaption>The density is proportional to the area. The mean and median are marked as in the first experiment.</figcaption></figure>
      <p class="lab-insight" id="quadratic-insight" aria-live="polite"></p>
    </section>
    <section class="panel lab-section" id="mechanics-lab" aria-labelledby="mechanics-title">
      <p class="lab-kicker">04 / Why bisection is not equilibrium</p><h2 id="mechanics-title">Balance versus least absolute deviation</h2>
      <p>Move a support plane to height aH. Equal weights on its two sides mean F(a) = 1/2. Mechanical balance instead requires zero first moment about the support: E(U − a) = 0. These generally occur at different heights.</p>
      <div class="lab-mechanics-controls"><div><label for="mechanics-profile">Use the profile from</label><select id="mechanics-profile"><option value="power">Power law (above)</option><option value="frustum" selected>Frustum (above)</option><option value="quadratic">Quadratic or cubic (above)</option></select></div>
        <div class="lab-slider-row"><label for="mechanics-a">Support height a</label><input id="mechanics-a" type="range" min="0" max="1" step="0.000001" value="0.673301"><output id="mechanics-a-out" for="mechanics-a">0.673301</output></div></div>
      <div class="presets"><button type="button" id="support-at-mean">Place at centroid (balance)</button><button type="button" id="support-at-median">Place at volume bisector</button></div>
      <div class="lab-metrics" id="mechanics-metrics" aria-live="polite"></div>
      <div class="lab-chart-grid"><figure class="lab-chart"><h3>Absolute deviation: E|U − a|</h3><div id="mechanics-l1"></div><figcaption>Minimum at the <span class="lab-blue">median</span>. White marker: chosen support.</figcaption></figure>
        <figure class="lab-chart"><h3>Squared deviation: E(U − a)²</h3><div id="mechanics-l2"></div><figcaption>Minimum at the <span class="lab-orange">mean</span>. White marker: chosen support.</figcaption></figure></div>
      <p class="lab-insight" id="mechanics-insight" aria-live="polite"></p>
      <p class="lab-equation">With homogeneous gravity, the signed gravitational moment per unit weight and height about aH is <strong>E(U − a) = mean − a</strong>. Its vanishing, not volume bisection, determines equilibrium.</p>
    </section>`;

    const kInput=document.getElementById('frustum-kappa');
    const aInput=document.getElementById('quadratic-a');
    const bInput=document.getElementById('quadratic-b');
    const cInput=document.getElementById('quadratic-c');
    const supportInput=document.getElementById('mechanics-a');
    const profileSelect=document.getElementById('mechanics-profile');
    let cubic=false;
    let frustum=frustumProfile(Number(kInput.value));
    let quadratic=quadraticProfile(Number(aInput.value),Number(bInput.value),Number(cInput.value));

    function renderFrustum() {
      const k=Number(kInput.value);
      frustum=frustumProfile(k);
      document.getElementById('frustum-kappa-out').textContent=fmt(k,6);
      document.getElementById('frustum-metrics').innerHTML=metricHTML(frustum);
      document.getElementById('frustum-density').innerHTML=densityChart(frustum,'Frustum');
      document.getElementById('frustum-gap').innerHTML=gapChart(k);
      document.getElementById('frustum-insight').textContent=
        `At κ = ${fmt(k,3)}, the two planes differ by ${pText(frustum.median-frustum.mean)} of the height. `+
        `The sharp frustum gives ${pText(SHARP_GAP_3D)}; the full cone gives ${pText(frustumProfile(0).median-frustumProfile(0).mean)}.`;
      if(profileSelect.value==='frustum') renderMechanics();
    }
    function renderQuadratic() {
      const a=Number(aInput.value),b=Number(bInput.value),c=Number(cInput.value);
      quadratic=cubic?cubicCounterexample():quadraticProfile(a,b,c);
      for(const [name,value] of [['a',a],['b',b],['c',c]])
        document.getElementById(`quadratic-${name}-out`).textContent=fmt(value,2);
      for(const input of [aInput,bInput,cInput]) input.disabled=cubic;
      document.getElementById('quadratic-metrics').innerHTML=metricHTML(quadratic);
      document.getElementById('quadratic-density').innerHTML=densityChart(quadratic,cubic?'Cubic counterexample':'Quadratic sections');
      const delta=quadratic.median-quadratic.mean;
      document.getElementById('quadratic-insight').textContent=cubic?
        `Degree three changes the conclusion: A(u) = 2 − u − 5u² + 7u³ is positive, A(1) = 3 > A(0) = 2, but m − mean = ${fmt(delta,5)} < 0. The quadratic sign rule cannot be extended by comparing endpoints alone.`:
        Math.abs(c-a)<1e-9?
        'The end areas are equal. For a quadratic area law, this forces the centroid and volume bisector to coincide, even if the shape is hourglass-like.':
        `Lower end = ${fmt(a,2)}, upper end = ${fmt(c,2)}. Because this area law is quadratic, `+
        (c>a?'the median lies above the centroid.':'the median lies below the centroid.');
      if(profileSelect.value==='quadratic') renderMechanics();
    }
    function currentMechanicsProfile() {
      const selected=profileSelect.value;
      return selected==='frustum'?frustum:selected==='quadratic'?quadratic:powerProfile(Number(document.getElementById('pexp').value));
    }
    function renderMechanics() {
      const profile=currentMechanicsProfile(), a=Number(supportInput.value);
      const balance=profile.mean-a, below=profile.cdf(a);
      document.getElementById('mechanics-a-out').textContent=fmt(a,6);
      document.getElementById('mechanics-metrics').innerHTML=`
        <div class="stat"><span class="stat-label">Volume below support</span><strong class="stat-value">${pText(below)}</strong></div>
        <div class="stat"><span class="stat-label">Moment / (weight × H)</span><strong class="stat-value">${fmt(balance,5)}</strong></div>
        <div class="stat median"><span class="stat-label">Median / H</span><strong class="stat-value">${fmt(profile.median,4)}</strong></div>
        <div class="stat mean"><span class="stat-label">Centroid / H</span><strong class="stat-value">${fmt(profile.mean,4)}</strong></div>`;
      document.getElementById('mechanics-l1').innerHTML=lossChart(profile,absoluteLoss,profile.median,a,'Absolute deviation',BLUE);
      document.getElementById('mechanics-l2').innerHTML=lossChart(profile,quadraticLoss,profile.mean,a,'Squared deviation',ORANGE);
      document.getElementById('mechanics-insight').textContent=
        `At a = ${fmt(a,3)}, ${pText(below)} of the volume is below the support and the signed moment is ${fmt(balance,5)} × (weight × H). `+
        (Math.abs(balance)<0.00051?'This support is at the centroid: the net moment vanishes.':
         `To balance, place it at a = ${fmt(profile.mean,4)}; to bisect volume, place it at a = ${fmt(profile.median,4)}.`);
    }

    kInput.addEventListener('input',renderFrustum);
    document.querySelectorAll('[data-frustum]').forEach(button=>button.addEventListener('click',()=>{
      kInput.value=button.dataset.frustum==='optimal'?fmt(OPTIMAL_RATIO,6):button.dataset.frustum;
      renderFrustum();kInput.focus();
    }));
    for(const input of [aInput,bInput,cInput]) input.addEventListener('input',()=>{cubic=false;renderQuadratic();});
    const quadPresets={widen:[.4,0,2],reverse:[2,0,.4],symmetric:[2,0,2]};
    document.querySelectorAll('[data-quad]').forEach(button=>button.addEventListener('click',()=>{
      cubic=button.dataset.quad==='cubic';
      if(!cubic){const vals=quadPresets[button.dataset.quad];[aInput,bInput,cInput].forEach((input,i)=>input.value=vals[i]);}
      renderQuadratic();button.focus();
    }));
    supportInput.addEventListener('input',renderMechanics);
    profileSelect.addEventListener('change',renderMechanics);
    document.getElementById('support-at-mean').addEventListener('click',()=>{
      supportInput.value=fmt(currentMechanicsProfile().mean,6);renderMechanics();supportInput.focus();
    });
    document.getElementById('support-at-median').addEventListener('click',()=>{
      supportInput.value=fmt(currentMechanicsProfile().median,6);renderMechanics();supportInput.focus();
    });
    document.getElementById('pexp').addEventListener('input',()=>{
      if(profileSelect.value==='power')renderMechanics();
    });
    renderFrustum();renderQuadratic();renderMechanics();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
  else setup();
})(typeof window!=='undefined'?window:globalThis);