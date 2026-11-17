import { useMemo } from "react";

interface Props {
  className?: string;
  /** centro da baixa pressão, em fração da largura/altura */
  cx?: number;
  cy?: number;
  linhas?: number;
  chuva?: boolean;
  cor?: string;
}

/**
 * Isóbaras desenhadas em SVG: curvas fechadas e irregulares ao redor de um
 * centro de baixa pressão, como num mapa sinótico. Determinístico.
 */
export function Isobaras({ className = "", cx = 0.72, cy = 0.46, linhas = 14, chuva = true, cor = "#0E5966" }: Props) {
  const { caminhos, gotas } = useMemo(() => {
    const W = 1600;
    const H = 900;
    const ox = W * cx;
    const oy = H * cy;
    const caminhos: { d: string; forte: boolean }[] = [];
    for (let k = 1; k <= linhas; k++) {
      const base = 38 + k * k * 4.2 + k * 34;
      const pts: [number, number][] = [];
      for (let i = 0; i < 120; i++) {
        const a = (i / 120) * Math.PI * 2;
        const ruido =
          1 +
          0.13 * Math.sin(2 * a + k * 0.35) +
          0.07 * Math.sin(3 * a - k * 0.6 + 1.2) +
          0.04 * Math.sin(5 * a + k * 0.9);
        const rx = base * ruido * 1.32;
        const ry = base * ruido * 0.82;
        pts.push([ox + rx * Math.cos(a), oy + ry * Math.sin(a)]);
      }
      // Catmull-Rom -> Bézier para uma curva suave
      let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
      for (let i = 0; i < pts.length; i++) {
        const p0 = pts[(i - 1 + pts.length) % pts.length];
        const p1 = pts[i];
        const p2 = pts[(i + 1) % pts.length];
        const p3 = pts[(i + 2) % pts.length];
        const c1x = p1[0] + (p2[0] - p0[0]) / 6;
        const c1y = p1[1] + (p2[1] - p0[1]) / 6;
        const c2x = p2[0] - (p3[0] - p1[0]) / 6;
        const c2y = p2[1] - (p3[1] - p1[1]) / 6;
        d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
      }
      caminhos.push({ d: d + "Z", forte: k % 4 === 0 });
    }
    // gotas: traços curtos inclinados perto do centro (chuva)
    const gotas: [number, number][] = [];
    let s = 42;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) {
      const a = rnd() * Math.PI * 2;
      const r = Math.sqrt(rnd()) * 300;
      gotas.push([ox + r * Math.cos(a) * 1.35, oy + r * Math.sin(a) * 0.85]);
    }
    return { caminhos, gotas };
  }, [cx, cy, linhas]);

  return (
    <svg className={className} viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill="none" stroke={cor}>
        {caminhos.map((c, i) => (
          <path key={i} d={c.d} strokeWidth={c.forte ? 1.3 : 0.8} strokeOpacity={c.forte ? 0.32 : 0.17} />
        ))}
      </g>
      {chuva && (
        <g stroke={cor} strokeOpacity={0.28} strokeWidth={1.4} strokeLinecap="round">
          {gotas.map(([x, y], i) => (
            <line key={i} x1={x} y1={y} x2={x - 5} y2={y + 13} />
          ))}
        </g>
      )}
    </svg>
  );
}
