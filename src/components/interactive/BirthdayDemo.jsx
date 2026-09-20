import { useState, useMemo, useEffect } from 'react';
import {
  collisionProb, requiredForProb, simulate, curve, fmtBig, scenarios,
} from '../../lib/birthday.js';
import Slider from './Slider.jsx';

const W = 600;
const H = 210;
const PAD = { l: 34, r: 14, t: 14, b: 26 };
const PW = W - PAD.l - PAD.r;
const PH = H - PAD.t - PAD.b;

function Chart({ points, maxN, n, n50, p, ratio }) {
  const xOf = (v) => PAD.l + (Math.min(v, maxN) / maxN) * PW;
  const yOf = (v) => PAD.t + (1 - v) * PH;
  const d = points
    .map((pt, i) => `${i === 0 ? 'M' : 'L'}${xOf(pt.n).toFixed(1)},${yOf(pt.p).toFixed(1)}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', background: '#fff', borderRadius: '8px', border: '1px solid #e6e4de' }}
    >
      {/* 水平网格 */}
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={PAD.l} y1={yOf(g)} x2={W - PAD.r} y2={yOf(g)} stroke={g === 0.5 ? '#2b5c4e' : '#eeece6'} strokeWidth={g === 0.5 ? 1.4 : 1} strokeDasharray={g === 0.5 ? '5 4' : undefined} />
          <text x={PAD.l - 6} y={yOf(g) + 3.5} fontSize="10" fill="#8a8a83" textAnchor="end">
            {g * 100}%
          </text>
        </g>
      ))}

      {/* 50% 位置（n50）的竖线 */}
      <line x1={xOf(n50)} y1={PAD.t} x2={xOf(n50)} y2={PAD.t + PH} stroke="#2b5c4e" strokeWidth="1" strokeDasharray="4 4" opacity=".55" />
      <text x={xOf(n50) + 4} y={PAD.t + 11} fontSize="10" fill="#2b5c4e">
        半数点 {fmtBig(n50)}
      </text>

      <path d={d} fill="none" stroke="#2b5c4e" strokeWidth="2.2" />

      {/* 当前抽取次数 */}
      <line x1={xOf(n)} y1={PAD.t} x2={xOf(n)} y2={PAD.t + PH} stroke="#c0492f" strokeWidth="1.4" />
      <circle cx={xOf(n)} cy={yOf(p)} r="4.5" fill="#c0492f" />

      <text x={PAD.l} y={H - 8} fontSize="10" fill="#8a8a83">1</text>
      <text x={W - PAD.r} y={H - 8} fontSize="10" fill="#8a8a83" textAnchor="end">
        {fmtBig(maxN)}
      </text>
      <text x={(PAD.l + W - PAD.r) / 2} y={H - 8} fontSize="10" fill="#b4b2a9" textAnchor="middle">
        抽取次数（当前 {ratio.toFixed(2)}× 半数点）
      </text>
    </svg>
  );
}

export default function BirthdayDemo() {
  const [key, setKey] = useState('birthday');
  const [ratio, setRatio] = useState(1);
  const [sim, setSim] = useState(null);

  const scene = scenarios.find((s) => s.key === key);
  const n50 = useMemo(() => requiredForProb(scene.d, 0.5), [scene]);
  const n = useMemo(() => Math.max(1, Math.round(ratio * n50)), [ratio, n50]);
  const p = useMemo(() => collisionProb(scene.d, n), [scene, n]);
  const maxN = useMemo(() => Math.round(n50 * 2.5), [n50]);
  const points = useMemo(() => curve(scene.d, maxN, 200), [scene, maxN]);

  useEffect(() => {
    setSim(null);
  }, [key, n]);

  const pairs = (n * (n - 1)) / 2;
  const canSimulate = scene.d <= 1e6 && n <= 5000;

  // 与生日场景对照，量化「平方根律」
  const base = scenarios[0];
  const baseN50 = requiredForProb(base.d, 0.5);
  const spaceX = scene.d / base.d;
  const timesX = n50 / baseN50;

  return (
    <div className="demo">
      <div className="demo-title">演示 · 换一个空间大小，看碰撞何时变得几乎必然</div>

      <div className="row" style={{ marginBottom: '.7rem', flexWrap: 'wrap' }}>
        {scenarios.map((s) => (
          <button
            key={s.key}
            className={s.key === key ? '' : 'ghost'}
            onClick={() => {
              setKey(s.key);
              setRatio(1);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '.7rem' }}>
        <Slider
          label="抽取次数"
          value={ratio}
          min={0.02}
          max={2.5}
          step={0.01}
          onChange={setRatio}
          hint={`${fmtBig(n)}`}
          labelWidth="4.4rem"
        />
        <div style={{ fontSize: '.74rem', color: '#8a8a83', marginTop: '-.2rem' }}>
          空间大小 d = {fmtBig(scene.d)}（{scene.hint}）· 半数点 = {fmtBig(n50)} {scene.unit}
        </div>
      </div>

      <div className="row" style={{ gap: '1.4rem', marginBottom: '.8rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '.72rem', color: '#8a8a83' }}>碰撞概率</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 600, color: p >= 0.5 ? '#c0492f' : '#2b5c4e', fontVariantNumeric: 'tabular-nums' }}>
            {(p * 100).toFixed(p < 0.999 ? 1 : 3)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '.72rem', color: '#8a8a83' }}>两两配对数</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {fmtBig(pairs)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '.72rem', color: '#8a8a83' }}>需要多少次才过半</div>
          <div style={{ fontSize: '1.7rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {fmtBig(n50)}
          </div>
        </div>
      </div>

      <Chart points={points} maxN={maxN} n={n} n50={n50} p={p} ratio={ratio} />

      <div className="row" style={{ marginTop: '.7rem', alignItems: 'flex-start', gap: '.6rem', flexWrap: 'wrap' }}>
        {canSimulate ? (
          <>
            <button className="ghost" onClick={() => setSim(simulate(scene.d, n, 4000, 20260920))}>
              真的随机试 4000 次
            </button>
            {sim && (
              <span className="stat">
                真的撞上了 <strong>{(sim.rate * 100).toFixed(1)}%</strong>，
                公式算的是 {(p * 100).toFixed(1)}%
              </span>
            )}
          </>
        ) : (
          <span className="stat">
            这个空间太大，随机试是试不出来的 —— 只能靠公式（这正是它可怕的地方）
          </span>
        )}
      </div>

      <div style={{ marginTop: '.8rem', fontSize: '.8rem', color: '#5c5c56', lineHeight: 1.65, borderTop: '1px solid #eeece6', paddingTop: '.6rem' }}>
        把空间从生日的 365 放大到 <strong>{scene.label}的 {fmtBig(scene.d)}</strong>
        （放大了 {fmtBig(spaceX)} 倍），需要抽取的次数只从 {baseN50} 涨到 {fmtBig(n50)}
        —— 只放大了 <strong>{fmtBig(timesX)}</strong> 倍，正好是平方根关系。
      </div>
    </div>
  );
}
