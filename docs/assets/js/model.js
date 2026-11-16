/* MeanMedianLab: analytic formulas for section-area profiles A(z)=C z^p.
 * The output is normalized by the total height H.
 * All functions require p >= 0. No external dependencies. */
(function (root) {
  'use strict';
  function validateExponent(p) {
    if (!Number.isFinite(p) || p < 0) {
      throw new RangeError('The exponent p must be a finite nonnegative number.');
    }
  }
  function meanHeight(p) {
    validateExponent(p);
    return (p + 1) / (p + 2);
  }
  function medianHeight(p) {
    validateExponent(p);
    return Math.exp(-Math.LN2 / (p + 1));
  }
  function gap(p) {
    validateExponent(p);
    return medianHeight(p) - meanHeight(p);
  }
  function fractionBelowMean(p) {
    validateExponent(p);
    return Math.pow(meanHeight(p), p + 1);
  }
  function heightDensity(u, p) {
    validateExponent(p);
    if (!Number.isFinite(u) || u < 0 || u > 1) return 0;
    return (p + 1) * Math.pow(u, p);
  }
  function heightCdf(u, p) {
    validateExponent(p);
    if (u <= 0) return 0;
    if (u >= 1) return 1;
    return Math.pow(u, p + 1);
  }
  const api = Object.freeze({meanHeight, medianHeight, gap, fractionBelowMean, heightDensity, heightCdf});
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MeanMedianLab = api;
})(typeof window !== 'undefined' ? window : this);
