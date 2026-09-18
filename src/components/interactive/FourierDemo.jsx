import { useState, useMemo, useEffect } from 'react';
import { coeffs, synthesize, target, errorStats } from '../../lib/fourier.js';
import Slider from './Slider.jsx';

const SCALE = 42;      // 每单位幅度对应的像素
const CX = 95;         // 圆链起点
const CY = 140;
const WAVE_X = 250;    // 波形区起点
const WAVE_W = 340;

const WAVES = [
  { key: 'square', label: '方波' },
  { key: 'saw', label: '锯齿波' },
  { key: 'triangle', label: '三角波' },
];

export default function FourierDemo() {
  const [wave, setWave] = useState('square');
  const [N, setN] = useState(9);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const [history, setHistory] = useState([]);

  const harmonics = useMemo(() => coeffs(wave, N), [wave, N]);
  const stats = useMemo(() => errorStats(wave, harmonics), [wave, harmonics]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((v) => v + 0.025), 30);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    setHistory((h) => [synthesize(harmonics, t), ...h].slice(0, WAVE_W));
  }, [t, harmonics]);

  useEffect(() => {
    setHistory([]);
  }, [wave, N]);

  // 圆链：每个谐波是一个以 n 倍频旋转的圆，首尾相接
  let x = CX;
  let y = CY;
  const circles = harmonics.map((h) => {
    const r = Math.abs(h.amp) * SCALE;
    const angle = h.n * t + (h.amp < 0 ? Math.PI : 0);
    const nx = x + r * Math.cos(angle);
    const ny = y - r * Math.sin(angle);
    const c = { cx: x, cy: y, r, nx, ny };
    x = nx;
    y = ny;
    return c;
  });

  const wavePath = history
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${WAVE_X + i},${(CY - v * SCALE).toFixed(1)}`)
    .join(' ');

  // 静态对比：一个完整周期，合成 vs 目标
  const cmp = [];
  const tgt = [];
  for (let i = 0; i <= 240; i++) {
    const tt = (i / 240) * 2 * Math.PI;
    const px = (i / 240) * 600;
    cmp.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${(55 - synthesize(harmonics, tt) * 38).toFixed(1)}`);
    tgt.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${(55 - target(wave, tt) * 38).toFixed(1)}`);
  }

  const maxAmp = Math.max(...harmonics.map((h) => Math.abs(h.amp)), 0.001);
  const bars = harmonics.slice(0, 24);

  return (
    <div className="demo">
      <div className="demo-title">演示 · 每个谐波是一个旋转的圆</div>

      <div className="row" style={{ marginBottom: '.7rem' }}>
        {WAVES.map((w) => (
          <button
            key={w.key}
            className={wave === w.key ? '' : 'ghost'}
            onClick={() => setWave(w.key)}
          >
            {w.label}
          </button>
        ))}
        <button className="ghost" onClick={() => setPlaying((p) => !p)}>
          {playing ? '暂停' : '播放'}
        </button>
      </div>

      <Slider
        label="谐波项数"
        value={N}
        min={1}
        max={49}
        step={1}
        onChange={setN}
        hint={`${harmonics.length} 项`}
      />

      <svg viewBox="0 0 600 280" width="100%" style={{ display: 'block', background: '#fff', borderRadius: '8px', border: '1px solid #e6e4de', marginTop: '.7rem' }}>
        <line x1={WAVE_X} y1={CY} x2="600" y2={CY} stroke="#ecebe5" strokeWidth="1" />
        {circles.map((c, i) => (
          <g key={i}>
            <circle cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke="#dcdad3" strokeWidth="1" />
            <line x1={c.cx} y1={c.cy} x2={c.nx} y2={c.ny} stroke="#8a8a83" strokeWidth="1.2" />
          </g>
        ))}
        <circle cx={x} cy={y} r="3" fill="#c0473a" />
        <line x1={x} y1={y} x2={WAVE_X} y2={CY - synthesize(harmonics, t) * SCALE} stroke="#c0473a" strokeWidth="1" strokeDasharray="3 3" />
        <path d={wavePath} fill="none" stroke="#1c1c1a" strokeWidth="2" />
        <text x="6" y="16" fontSize="10" fill="#b4b2a9">圆：每个频率一个</text>
        <text x={WAVE_X + 4} y="16" fontSize="10" fill="#b4b2a9">笔尖画出的波形</text>
      </svg>

      <div style={{ fontSize: '.74rem', color: '#8a8a83', margin: '.7rem 0 .2rem' }}>
        一个完整周期：黑色的合成波形 vs 灰色的目标波形
      </div>
      <svg viewBox="0 0 600 110" width="100%" style={{ display: 'block', background: '#fff', borderRadius: '8px', border: '1px solid #e6e4de' }}>
        <line x1="0" y1="55" x2="600" y2="55" stroke="#ecebe5" strokeWidth="1" />
        <path d={tgt.join(' ')} fill="none" stroke="#b4b2a9" strokeWidth="1.5" strokeDasharray="4 3" />
        <path d={cmp.join(' ')} fill="none" stroke="#1c1c1a" strokeWidth="2" />
      </svg>

      <div style={{ fontSize: '.74rem', color: '#8a8a83', margin: '.7rem 0 .2rem' }}>
        频谱：每个谐波占多少（这就是「音色」的配方）
      </div>
      <svg viewBox="0 0 600 70" width="100%" style={{ display: 'block', background: '#fff', borderRadius: '8px', border: '1px solid #e6e4de' }}>
        {bars.map((h, i) => {
          const w = 600 / bars.length;
          const hgt = (Math.abs(h.amp) / maxAmp) * 58;
          return (
            <rect
              key={i}
              x={i * w + 1}
              y={62 - hgt}
              width={Math.max(2, w - 2)}
              height={hgt}
              fill={h.amp >= 0 ? '#2b5c4e' : '#c0473a'}
            />
          );
        })}
      </svg>

      <div className="row" style={{ marginTop: '.7rem', gap: '1.1rem' }}>
        <span className="stat">用了 <b>{harmonics.length}</b> 个谐波</span>
        <span className="stat">均方根误差 <b>{stats.rmse.toFixed(3)}</b></span>
        <span className="stat">
          跳变处过冲 <b style={{ color: stats.overshoot > 1 ? '#c0473a' : '#4a4a46' }}>{stats.overshoot.toFixed(1)}%</b>
        </span>
      </div>

      <div className="demo-note">
        把谐波从 1 拖到 49：方波的误差掉得很慢（谐波按 1/n 衰减），三角波却几项就够了（按 1/n² 衰减）——
        <b>波形越光滑，高频成分越少</b>。再看方波那两头：无论加多少项，跳变边上那两个尖角都不会消失，
        只会变窄，这就是吉布斯现象。
      </div>
    </div>
  );
}
