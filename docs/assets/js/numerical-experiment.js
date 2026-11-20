/* Numerical discovery panel for the frustum gap in the AMM manuscript.
 * A finite grid is exploratory; golden-section refinement is numerical, not proof. */
(() => {
  'use strict';
  const ext = window.MeanMedianExtensions;
  const host = document.getElementById('numerical-experiment');
  if (!host || !ext) return;
  const KSTAR = ext.OPTIMAL_RATIO, GSTAR = ext.SHARP_GAP_3D;
  const gap = k => {
    const p = ext.frustumProfile(k);
    return p.median - p.mean;
  };
  function gridSearch(n) {
    let best = {k: 0, value: gap(0), index: 0};
    const samples = [];
    for (let i=0;i<n;i++) {
      const k=i/(n-1), value=gap(k);
      samples.push({k,value});
      if (value>best.value) best={k,value,index:i};
    }
    return {samples,best};
  }
  function goldenMax(a,b,tolerance=1e-11) {
    const rho=(Math.sqrt(5)-1)/2;
    let c=b-rho*(b-a), d=a+rho*(b-a);
    let fc=gap(c), fd=gap(d), iterations=0;
    while (b-a>tolerance && iterations<160) {
      if (fc<fd) {a=c;c=d;fc=fd;d=a+rho*(b-a);fd=gap(d);}
      else {b=d;d=c;fd=fc;c=b-rho*(b-a);fc=gap(c);}
      iterations++;
    }
    const k=(a+b)/2;
    return {k,value:gap(k),iterations,width:b-a};
  }
  function refine(sample) {
    const {samples,best}=sample;
    const a=samples[Math.max(0,best.index-1)].k;
    const b=samples[Math.min(samples.length-1,best.index+1)].k;
    return goldenMax(a,b);
  }
  host.innerHTML=`
    <p class="lab-kicker">Numerical discovery · Reproducible computation</p>
    <h2 id="numerical-heading">Can a numerical search find the sharp frustum?</h2>
    <p>The manuscript samples the gap function and refines its largest value with a bounded scalar search. Change the grid resolution to see how the estimate improves. The numerical maximum is a <em>candidate</em>; the comparison lemma and optimizer certificate establish the theorem.</p>
    <div class="lab-slider-row">
      <label for="num-resolution">Grid points</label>
      <input id="num-resolution" type="range" min="9" max="401" step="8" value="41">
      <output id="num-resolution-value" for="num-resolution">41</output>
    </div>
    <div class="presets">
      <button type="button" data-num-grid="9">Coarse · 9</button>
      <button type="button" data-num-grid="41">Medium · 41</button>
      <button type="button" data-num-grid="201">Fine · 201</button>
      <button type="button" data-num-grid="401">Very fine · 401</button>
    </div>
    <div class="lab-metrics" aria-live="polite">
      <div class="stat"><span class="stat-label">Grid maximizer κ</span><span class="stat-value" id="num-grid-k">—</span></div>
      <div class="stat"><span class="stat-label">Grid maximum g</span><span class="stat-value" id="num-grid-g">—</span></div>
      <div class="stat"><span class="stat-label">Refined maximizer κ</span><span class="stat-value" id="num-refined-k">—</span></div>
      <div class="stat"><span class="stat-label">Refined maximum g</span><span class="stat-value" id="num-refined-g">—</span></div>
    </div>
    <figure class="lab-chart">
      <h3>Gap curve, sampled points, and refined maximum</h3>
      <svg id="num-chart" viewBox="0 0 720 310" role="img" aria-label="Frustum gap function with sampled points, grid maximum and refined numerical maximum"></svg>
      <figcaption>Dots are grid evaluations. Orange marks the best grid point; blue marks the refined numerical estimate. The thin dashed line marks the analytically certified optimum for comparison.</figcaption>
    </figure>
    <div class="lab-num-details" aria-live="polite" id="num-details"></div>
    <p class="lab-equation"><strong>Reproducible algorithm.</strong> Evaluate g(κ) on a uniform grid in [0,1]; select the largest sample; apply golden-section maximization on the interval between its immediate grid neighbors. The search is derivative-free and deterministic. The endpoint g(1)=0 is evaluated by continuity.</p>
    <p class="lab-insight">The full cone (κ = 0) has gap 0.0437005…, while the optimal frustum reaches 0.0518932…. The interior optimum is the numerical clue; the mathematical proof shows why no convex solid can exceed it.</p>
  `;
  const $=id=>document.getElementById(id);
  const slider=$('num-resolution');
  const fmt=(x,n=7)=>x.toFixed(n);
  function plot(result,refined) {
    const svg=$('num-chart'), X=k=>60+620*k, Y=g=>252-206*g/0.058;
    const line=(x1,y1,x2,y2,color,dash='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" ${dash?'stroke-dasharray="'+dash+'"':''}/>`;
    let markup='';
    for(let j=0;j<=4;j++){
      const k=j/4;
      markup+=line(X(k),35,X(k),252,'#293b4c');
      markup+=`<text x="${X(k)}" y="274" text-anchor="middle" fill="#a1b0c1" font-size="13">${k.toFixed(2)}</text>`;
    }
    for(let j=0;j<=3;j++){
      const g=j*.02;
      markup+=line(60,Y(g),680,Y(g),'#293b4c');
      markup+=`<text x="51" y="${Y(g)+4}" text-anchor="end" fill="#a1b0c1" font-size="12">${g.toFixed(2)}</text>`;
    }
    const path=Array.from({length:501},(_,i)=>{
      const k=i/500;return `${i?'L':'M'}${X(k).toFixed(2)},${Y(gap(k)).toFixed(2)}`;
    }).join(' ');
    markup+=`<path d="${path}" fill="none" stroke="#dce8f4" stroke-width="2.3"/>`;
    markup+=line(X(KSTAR),35,X(KSTAR),252,'#76c8f2','5 5');
    for(const p of result.samples) markup+=`<circle cx="${X(p.k)}" cy="${Y(p.value)}" r="2.7" fill="#8d9dac"/>`;
    markup+=`<circle cx="${X(result.best.k)}" cy="${Y(result.best.value)}" r="6" fill="#f7af7a" stroke="#080e17" stroke-width="2"/>`;
    markup+=`<circle cx="${X(refined.k)}" cy="${Y(refined.value)}" r="5" fill="#76c8f2" stroke="#080e17" stroke-width="2"/>`;
    markup+=`<text x="65" y="21" fill="#a1b0c1" font-size="14">g(κ) = (median − mean)/H</text><text x="370" y="300" text-anchor="middle" fill="#a1b0c1" font-size="14">End-radius ratio κ</text>`;
    svg.innerHTML=markup;
  }
  function render() {
    const n=Number(slider.value);
    const sample=gridSearch(n), refined=refine(sample);
    $('num-resolution-value').textContent=String(n);
    $('num-grid-k').textContent=fmt(sample.best.k,6);
    $('num-grid-g').textContent=fmt(sample.best.value,8);
    $('num-refined-k').textContent=fmt(refined.k,9);
    $('num-refined-g').textContent=fmt(refined.value,10);
    $('num-details').innerHTML=`<span><strong>Grid spacing:</strong> ${fmt(1/(n-1),6)}</span>
      <span><strong>Grid |κ − κ*|:</strong> ${fmt(Math.abs(sample.best.k-KSTAR),8)}</span>
      <span><strong>Refinement steps:</strong> ${refined.iterations}</span>
      <span><strong>Refined |κ − κ*|:</strong> ${fmt(Math.abs(refined.k-KSTAR),9)}</span>
      <span><strong>Refined |g − G₃|:</strong> ${Math.abs(refined.value-GSTAR).toExponential(2)}</span>`;
    plot(sample,refined);
  }
  slider.addEventListener('input',render);
  host.querySelectorAll('[data-num-grid]').forEach(b=>b.addEventListener('click',()=>{
    slider.value=b.dataset.numGrid;render();slider.focus();
  }));
  render();
})();
