(() => {
      'use strict';
      const math = window.MeanMedianLab;
      if (!math) throw new Error('MeanMedianLab model.js was not loaded');
      const ns = 'http://www.w3.org/2000/svg';
      const slider = document.getElementById('pexp');
      const axes = document.getElementById('axes');
      const labels = document.getElementById('labels');
      const shade = document.getElementById('shade');
      const curve = document.getElementById('curve');
      const meanLine = document.getElementById('ml');
      const medianLine = document.getElementById('ql');
      const x0 = 75, x1 = 854, y0 = 367, y1 = 58;
      const dx = x1 - x0, dy = y0 - y1;
      const blue = '#76c8f2', orange = '#f7af7a', gray = '#a1b0c1';

      function appendLine(parent, xa, ya, xb, yb, stroke, width = 1) {
        const line = document.createElementNS(ns, 'line');
        Object.entries({x1: xa, y1: ya, x2: xb, y2: yb, stroke, 'stroke-width': width})
          .forEach(([key, value]) => line.setAttribute(key, value));
        parent.appendChild(line);
      }
      function appendText(parent, x, y, content, color = gray, size = 14, anchor = 'middle') {
        const label = document.createElementNS(ns, 'text');
        Object.entries({x, y, fill: color, 'font-size': size, 'text-anchor': anchor,
          'font-family': 'system-ui, Arial, sans-serif'})
          .forEach(([key, value]) => label.setAttribute(key, value));
        label.textContent = content;
        parent.appendChild(label);
      }
      function draw() {
        const p = Number(slider.value);
        const mean = math.meanHeight(p);
        const median = math.medianHeight(p);
        const gap = math.gap(p);
        const fraction = math.fractionBelowMean(p);
        const ymax = p + 1;
        const xs = u => x0 + u * dx;
        const ys = f => y0 - f * dy / ymax;
        const density = u => math.heightDensity(u, p);

        document.getElementById('pout').textContent = p.toFixed(1);
        document.getElementById('meanv').textContent = mean.toFixed(4) + ' H';
        document.getElementById('medv').textContent = median.toFixed(4) + ' H';
        document.getElementById('gapv').textContent = gap.toFixed(4);
        document.getElementById('fracv').textContent = (100 * fraction).toFixed(2) + '%';
        slider.setAttribute('aria-valuetext', 'p equals ' + p.toFixed(1));
        document.getElementById('geometryNote').textContent =
          p === 0 ? 'Constant-area profile: mean and median coincide at mid-height.' :
          p === 1 ? 'Paraboloid (or wedge): the centroid plane leaves exactly 4/9 of the volume below.' :
          p === 2 ? 'Cone (or pyramid): the centroid plane leaves 27/64 of the volume below.' :
          p > 2 ? 'For p > 2, this profile cannot belong to a convex three-dimensional solid.' :
                  'Increasing sectional area places the median above the mean.';

        axes.replaceChildren();
        labels.replaceChildren();
        for (let j = 0; j <= 5; j++) {
          const u = j / 5;
          appendLine(axes, xs(u), y0, xs(u), y1, '#293b4c');
          appendText(axes, xs(u), y0 + 22, u.toFixed(1), gray, 13);
        }
        for (let j = 0; j <= 4; j++) {
          const q = j / 4;
          appendLine(axes, x0, ys(q * ymax), x1, ys(q * ymax), '#243545');
          appendText(axes, x0 - 11, ys(q * ymax) + 4, (q * ymax).toFixed(1), gray, 13, 'end');
        }
        appendLine(axes, x0, y0, x1, y0, '#8c9eb0', 1.4);
        appendLine(axes, x0, y0, x0, y1, '#8c9eb0', 1.4);
        appendText(axes, (x0 + x1) / 2, y0 + 55, 'Normalized height  u = z/H', '#cad7e5', 16);
        appendText(axes, x0, 29, 'Probability density', '#cad7e5', 15, 'start');

        let path = '';
        let shaded = `M ${x0} ${y0}`;
        const steps = 400;
        for (let j = 0; j <= steps; j++) {
          const u = j / steps;
          const point = `${xs(u).toFixed(2)} ${ys(density(u)).toFixed(2)}`;
          path += `${j ? ' L ' : 'M '}${point}`;
          if (u <= median) shaded += ` L ${point}`;
        }
        shaded += ` L ${xs(median).toFixed(2)} ${ys(density(median)).toFixed(2)}`;
        shaded += ` L ${xs(median).toFixed(2)} ${y0} Z`;
        curve.setAttribute('d', path);
        shade.setAttribute('d', shaded);
        for (const [element, u] of [[meanLine, mean], [medianLine, median]]) {
          element.setAttribute('x1', xs(u));
          element.setAttribute('x2', xs(u));
          element.setAttribute('y1', y0);
          element.setAttribute('y2', ys(density(u)));
        }
        appendText(labels, Math.min(xs(mean) - 12, x1 - 14), 47, 'Mean ' + mean.toFixed(3), orange, 14, 'end');
        const nearRightEdge = median > 0.80;
        appendText(labels, nearRightEdge ? xs(median) - 10 : xs(median) + 12, 70,
          'Median ' + median.toFixed(3), blue, 14, nearRightEdge ? 'end' : 'start');
      }
      slider.addEventListener('input', draw);
      document.querySelectorAll('[data-preset]').forEach(button => {
        button.addEventListener('click', () => {
          slider.value = button.dataset.preset;
          draw();
          slider.focus();
        });
      });
      draw();
    })();
