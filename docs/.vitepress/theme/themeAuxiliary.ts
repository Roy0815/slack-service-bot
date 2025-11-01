// ordnet die actor-top und actor-bottom Gruppen mit passenden Indizes
export function tagActorGroups() {
  // exit in server side rendering, weil kein DOM vorhanden
  if (typeof document === 'undefined') return;

  const svgs = document.querySelectorAll<SVGSVGElement>('svg');

  svgs.forEach((svg, svgIndex) => {
    const tops = Array.from(svg.querySelectorAll<SVGGElement>(':scope > g'))
      .filter((g) => g.querySelector('rect.actor-top'))
      .reverse();

    const bottoms = Array.from(svg.querySelectorAll<SVGGElement>(':scope > g'))
      .filter((g) => g.querySelector('rect.actor-bottom'))
      .reverse();

    const activations = Array.from(
      svg.querySelectorAll<SVGGElement>('g > rect.activation0')
    ).map((r) => r.parentElement as unknown as SVGGElement);

    const count = Math.min(tops.length, bottoms.length);

    // Nummerierung für Top + Bottom
    for (let i = 0; i < count; i++) {
      const idx = i + 1;
      const top = tops[i];
      const bottom = bottoms[i];

      top.dataset.actorIndex = bottom.dataset.actorIndex = String(idx);
      top.dataset.diagramIndex = bottom.dataset.diagramIndex = String(
        svgIndex + 1
      );
    }

    // Zuordnung für Activations über X-Position
    activations.forEach((g) => {
      const rect = g.querySelector('rect.activation0');
      if (!rect) return;

      const x = parseFloat(rect.getAttribute('x') || '0');
      const width = parseFloat(rect.getAttribute('width') || '0');
      const centerX = x + width / 2;

      // passenden Actor suchen (nach horizontalem Überlappen)
      const match = tops.find((top) => {
        const actorRect = top.querySelector('rect.actor-top');
        if (!actorRect) return false;
        const ax = parseFloat(actorRect.getAttribute('x') || '0');
        const aw = parseFloat(actorRect.getAttribute('width') || '0');
        return centerX >= ax && centerX <= ax + aw;
      });

      if (match) {
        const idx = match.dataset.actorIndex;
        g.dataset.actorIndex = idx;
        g.dataset.diagramIndex = String(svgIndex + 1);
      }
    });
  });
}

// wartet, bis alle SVGs wirklich gerendert wurden
export function waitForAllSVGs(selector = 'svg > g', timeout = 200) {
  return new Promise<void>((resolve) => {
    // exit in server side rendering, weil kein DOM vorhanden
    if (typeof document === 'undefined') return;

    const start = performance.now();
    const check = () => {
      const svgs = document.querySelectorAll(selector);
      if (
        svgs.length &&
        Array.from(svgs).every((el) => el.childElementCount > 0)
      ) {
        resolve();
      } else if (performance.now() - start < timeout) {
        requestAnimationFrame(check);
      } else {
        resolve();
      }
    };
    check();
  });
}
