# MeanMedianLab — Interactive Mean–Median Geometry

**MeanMedianLab** is a compact open educational web resource for investigating
the difference between the centroid (mean height) of a homogeneous solid and
the horizontal plane that divides its volume into two equal parts (median height).

The laboratory is the online companion to *Bisecting Is Not Balancing: How Far Apart?*, an expository manuscript by Americo Cunha Jr.

<p align="center">
  <img src="docs/assets/img/MeanMedianLab-Cover.svg" alt="MeanMedianLab interactive dashboard" width="80%">
</p>

**Interactive website:** https://americocunha.org/MeanMedianLab 

**Repository:** https://github.com/americocunhajr/MeanMedianLab

> The site is published from the repository root with GitHub Pages.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Mathematical model](#mathematical-model)
- [Usage](#usage)
- [Repository structure](#repository-structure)
- [Validation and reproducibility](#validation-and-reproducibility)
- [Author](#author)
- [Citation](#citation)
- [License](#license)
- [Institutional support](#institutional-support)
- [Funding](#funding)

## Overview

If a homogeneous solid is described by a sectional-area profile
$A(z)=Cz^p$ on $0\le z\le H$, the vertical centroid and the volume-bisecting
plane need not coincide. By changing the exponent $p$, **MeanMedianLab** makes
this geometric distinction quantitative and visible, without requiring any
server-side computation.

## Features

- Four additional interactive panels alongside the original power-law explorer:
  - Conical frustums and the sharp three-dimensional mean–median bound.
  - Quadratic sectional areas, the endpoint sign rule, and a cubic counterexample.
  - Mechanical balance, volume bisection, and the distinct absolute/squared loss minima.
  - Numerical frustum optimization: grid sampling, golden-section refinement, convergence diagnostics, and comparison with the certified optimum.
- Deterministic analytic calculations with a tested median solver.
- Numerical exploration uses a uniform grid and bounded golden-section search; it illustrates, but does not prove, the sharp inequality.

- Interactive exponent control for $0\le p\le 12$.
- Presets for the cylinder ($p=0$), paraboloid or wedge ($p=1$), and cone or pyramid ($p=2$).
- Live display of mean, median, normalized gap, and volume fraction below the centroid.
- Probability-density plot with the half-volume region marked.
- Responsive dark interface with keyboard-accessible controls.
- Static HTML, CSS, and JavaScript; no build step or third-party runtime dependencies.

## Mathematical model

For $U=Z/H$ (the normalized height of a uniformly selected point in the solid),

```math
f_U(u)=(p+1)u^p,\qquad F_U(u)=u^{p+1},\qquad 0\le u\le 1.
```

The normalized mean and median are, respectively,

```math
\frac{\bar z}{H}=\frac{p+1}{p+2},
\qquad
\frac{m}{H}=2^{-1/(p+1)}.
```

The fraction of volume below the centroid plane is

```math
F_U(\bar z/H)=\left(\frac{p+1}{p+2}\right)^{p+1}.
```

When $p=1$, the centroid plane leaves exactly $4/9$ of the paraboloid's
volume below it. When $p=2$, the fraction is $27/64$.

The family represents valid nonnegative sectional-area functions for all
$p\ge0$, although profiles with $p>2$ cannot belong to a convex solid
in three dimensions.

## Repository structure

```text
MeanMedianLab/
├── README.md
├── CITATION.cff
├── LICENSE
├── .gitignore
├── docs/
│   ├── .nojekyll
│   ├── index.html
│   └── assets/
│       ├── css/style.css
│       ├── img/MeanMedianLab-Cover.svg
│       └── js/
│           ├── model.js
│           ├── app.js
│           ├── extended-labs.js
│           └── numerical-experiment.js
├── tests/
│   └── model.test.js
└── publications/
    └── README.md
```

## Validation and reproducibility

All numerical indicators come from analytical formulas implemented in
`docs/assets/js/model.js`. A dependency-free test suite verifies exact
reference cases, limiting properties, and probability normalization:

```bash
node --test tests/model.test.js
```

No stochastic sampling is involved: the results are deterministic and
reproducible across modern browsers. Model functions are kept separate
from the visual presentation for inspection and reuse.

## Citation

If **MeanMedianLab** contributes to teaching or research, please cite:

> A. Cunha Jr, *MeanMedianLab: Interactive Mean–Median Geometry*,
> GitHub repository, 2026.

```bibtex
@misc{CunhaJr2026MeanMedianLab,
  author       = {A. {Cunha~Jr}},
  title        = {{MeanMedianLab}: Interactive Mean--Median Geometry},
  year         = {2026},
  howpublished = {GitHub repository},
  url          = {https://github.com/americocunhajr/MeanMedianLab},
}
```

A `CITATION.cff` file is provided for GitHub's **Cite this repository** feature.
See [publications/README.md](publications/README.md) for the associated
expository manuscript. No article DOI is assigned here before publication.

## License

**MeanMedianLab** is released under the MIT license, consistent with several of the author's software repositories. See [LICENSE](LICENSE) for details.

<img src="logo/mit_license_red.png" width="10%"> 

### Institutional support

<img src="logo/logo_lncc.png" width="25%"> &nbsp; &nbsp; &nbsp; <img src="logo/logo_uerj.png" width="10%"> 

### Funding

<img src="logo/faperj.png" width="25%"> &nbsp; &nbsp; <img src="logo/cnpq.png" width="20%"> &nbsp; &nbsp; <img src="logo/capes.png" width="10%">


## Author

**Americo Cunha Jr.** is Research Faculty at the National Laboratory for Scientific Computing (LNCC) and Professor of Applied and Computational Mathematics at Rio de Janeiro State University (UERJ), Brazil. See [his academic website](https://americocunha.org/).
