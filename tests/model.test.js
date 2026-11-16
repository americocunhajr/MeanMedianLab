const test = require('node:test');
const assert = require('node:assert/strict');
const m = require('../docs/assets/js/model.js');
const close = (actual, expected, tol=1e-11) => assert.ok(Math.abs(actual-expected)<tol, `${actual} != ${expected}`);

test('uniform sections: coincident mean and median', () => {
  close(m.meanHeight(0), 0.5);
  close(m.medianHeight(0), 0.5);
  close(m.fractionBelowMean(0), 0.5);
  close(m.gap(0), 0);
});
test('paraboloid/wedge p=1', () => {
  close(m.meanHeight(1), 2/3);
  close(m.medianHeight(1), 1/Math.sqrt(2));
  close(m.fractionBelowMean(1), 4/9);
});
test('cone/pyramid p=2', () => {
  close(m.meanHeight(2), 3/4);
  close(m.medianHeight(2), Math.pow(2,-1/3));
  close(m.fractionBelowMean(2), 27/64);
});
test('density normalization, mean, and median by quadrature', () => {
  const n=10000;
  for(const p of [0,0.25,0.5,1,2,4,12]) {
    let volume=0, first=0;
    for(let j=0;j<n;j++){
      const u=(j+0.5)/n;
      const dens=m.heightDensity(u,p);
      volume += dens/n;
      first += u*dens/n;
    }
    close(volume,1,2e-5);
    close(first,m.meanHeight(p),2e-5);
    close(m.heightCdf(m.medianHeight(p),p),0.5,1e-12);
  }
});
test('ordering and invalid exponents', () => {
  for(const p of [0.1,0.5,1,1.767,2,7,12]) assert.ok(m.medianHeight(p)>m.meanHeight(p));
  for(const p of [-1,NaN,Infinity]) assert.throws(()=>m.meanHeight(p),RangeError);
});
