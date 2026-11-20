'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../docs/assets/js/extended-labs.js');
const close = (a,b,tol=1e-10) => assert.ok(Math.abs(a-b)<tol, `${a} != ${b}`);

test('frustum endpoints reproduce the cone and cylinder', () => {
  const cone=m.frustumProfile(0), cylinder=m.frustumProfile(1);
  close(cone.mean,3/4);close(cone.median,Math.cbrt(0.5));
  close(cone.fractionBelowMean,27/64);
  close(cylinder.mean,.5);close(cylinder.median,.5);
  close(cylinder.fractionBelowMean,.5);
});

test('extremizing frustum achieves the sharp constant', () => {
  const f=m.frustumProfile(m.OPTIMAL_RATIO);
  close(f.median-f.mean,m.SHARP_GAP_3D,1e-11);
  for(const k of [0,.01,.1,.25,.35,.5,.75,1]) {
    const g=m.frustumProfile(k);assert.ok(g.median-g.mean <= m.SHARP_GAP_3D+1e-11);
  }
});

test('quadratic Bernstein family preserves endpoint sign theorem',()=>{
  for(const a of [.1,.5,1,3]) for(const b of [0,.2,1,4]) for(const c of [.1,.5,1,3]) {
    const p=m.quadraticProfile(a,b,c);close(p.cdf(p.median),.5,1e-12);
    const gap=p.median-p.mean;
    assert.ok((c-a)*gap>=-1e-12,JSON.stringify({a,b,c,gap}));
    if(c===a)close(gap,0,1e-12);
  }
});

test('cubic counterexample reverses end-section sign',()=>{
  const p=m.cubicCounterexample();
  close(p.mean,49/95);assert.ok(p.cdf(p.mean)>.5);
  assert.ok(p.median<p.mean);
  close(p.area(0),2);close(p.area(1),3);
  for(let i=0;i<=100;i++)assert.ok(p.area(i/100)>0);
});

test('all profiles normalize, and losses minimize at the correct heights',()=>{
  const profiles=[m.powerProfile(1),m.frustumProfile(.267628),m.quadraticProfile(.4,0,2),m.cubicCounterexample()];
  for(const p of profiles){
    close(p.cdf(1),1);close(p.cdf(p.median),.5,1e-12);
    close(p.partialFirst(1),p.mean);
    const l1=m.absoluteLoss(p,p.median), l2=m.quadraticLoss(p,p.mean);
    for(let j=0;j<=100;j++){
      const a=j/100;
      assert.ok(m.absoluteLoss(p,a)>=l1-1e-12);
      assert.ok(m.quadraticLoss(p,a)>=l2-1e-12);
    }
  }
});

test('invalid inputs fail with clear errors',()=>{
  assert.throws(()=>m.frustumProfile(-.2),RangeError);
  assert.throws(()=>m.frustumProfile(1.1),RangeError);
  assert.throws(()=>m.quadraticProfile(0,1,2),RangeError);
  assert.throws(()=>m.powerProfile(-.2),RangeError);
});