import { useState, useMemo, useEffect } from 'react';
import { simulate, metrics } from '../../lib/feedback.js';
import Slider from './Slider.jsx';

const STEPS = 90;
const TARGET = 40;

const PRESETS = [
  { key: 'impatient', label: '急性子', p: { delay: 3, gain: 0.8, patience: 1, alpha: 0.25 } },
  { key: 'master', label: '老手', p: { delay: 3, gain: 0.4, patience: 4, alpha: 0.25 } },
  { key: 'nodelay', label: '如果零延迟', p: { delay: 1, gain: 0.8, patience: 1, alpha: 0.25 } },
  { key: 'longpipe', label: '超长管道', p: { delay: 8, gain: 0.8, patience: 1, alpha: 0.08 } },
];

export default function FeedbackDemo() {
  const [params, setParams] = useState({ delay: 3, gain: 0.8, patience: 1, alpha: 0.25 });
  const [frame, setFrame] = useState(null); // null = 一次画完
  const [playing, setPlaying] = useState(false);

  const run = useMemo(() => simulate({ ...params, steps: STEPS, target: TARGET }), [params]);
  const m = useMemo(() => metrics(run.series, TARGET), [run]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setFrame((f) => {
        const cur = f === null ? 0 : f;
        if (cur >= STEPS) {
          setPlaying(false);
          return null;
        }
        return cur + 1;
      });
    }, 45);
    return () => clearInterval(id);
  }, [playing]);

  const set = (k) => (v) => {
    setParams((p) => ({ ...p, [k]: v }));
    setFrame(null);
    setPlaying(false);
  };

  const shown = frame === null ? STEPS : frame;
  const series = run.series.slice(0, shown);
  const knob = run.knob.slice(0, shown);

  const yOf = (t) => 208 - ((Math.max(8, Math.min(100, t)) - 8) / 92) * 192;
  const xOf = (i) => (i / (STEPS - 1)) * 600;
  const path = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`).join(' ');

  return (
    <div className="demo">
      <div className="demo-title">演示 · 淋浴水温模拟器</div>

      <div style={{ marginBottom: '.9rem' }}>
        <Slider label="管道延迟" value={params.delay} min={1} max={10} step={1} onChange={set('delay')} hint={`${params.delay} 步`} />
        <Slider label="手劲" value={params.gain} min={0.05} max={1} step={0.05} onChange={set('gain')} hint={params.gain.toFixed(2)} />
        <Slider label="耐心" value={params.patience} min={1} max={8} step={1} onChange={set('patience')} hint={`每 ${params.patience} 步`} />
        <Slider label="管道反应" value={params.alpha} min={0.05} max={0.5} step={0.01} onChange={set('alpha')} hint={params.alpha.toFixed(2)} />
      </div>

      <div className="row" style={{ marginBottom: '.8rem' }}>
        {PRESETS.map((p) => (
          <button
            key={p.key}
            className="ghost"
            onClick={() => {
              setParams(p.p);
              setFrame(null);
              setPlaying(false);
            }}
          >
            {p.label}
          </button>
        ))}
        <button onClick={() => { setFrame(0); setPlaying(true); }}>逐步播放</button>
      </div>

      <svg viewBox="0 0 600 220" width="100%" style={{ display: 'block', background: '#fff', borderRadius: '8px', border: '1px solid #e6e4de' }}>
        {[20, 40, 60, 80].map((t) => (
          <g key={t}>
            <line x1="0" y1={yOf(t)} x2="600" y2={yOf(t)} stroke="#ecebe5" strokeWidth="1" />
            <text x="4" y={yOf(t) - 4} fontSize="10" fill="#b4b2a9">{t}°</text>
          </g>
        ))}
        <line x1="0" y1={yOf(TARGET)} x2="600" y2={yOf(TARGET)} stroke="#2b5c4e" strokeWidth="1.5" strokeDasharray="5 4" />
        <text x="596" y={yOf(TARGET) - 5} fontSize="10" fill="#2b5c4e" textAnchor="end">目标 40°</text>

        <path d={path(knob)} fill="none" stroke="#dcdad3" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d={path(series)} fill="none" stroke="#1c1c1a" strokeWidth="2" />
        {series.length > 0 && (
          <circle cx={xOf(series.length - 1)} cy={yOf(series[series.length - 1])} r="3.5" fill="#c0473a" />
        )}
      </svg>

      <div className="row" style={{ marginTop: '.8rem', gap: '1.2rem' }}>
        <span className="stat">
          峰值 <b>{m.peak.toFixed(1)}°</b>
        </span>
        <span className="stat">
          超调 <b style={{ color: m.overshoot > 10 ? '#c0473a' : '#2b5c4e' }}>{m.overshoot.toFixed(1)}°</b>
        </span>
        <span className="stat">
          {m.settled ? <b style={{ color: '#2b5c4e' }}>收敛</b> : <b style={{ color: '#c0473a' }}>持续振荡</b>}
        </span>
        <span className="stat" style={{ color: '#8a8a83' }}>灰虚线 = 你的旋钮位置</span>
      </div>

      <div className="demo-note">
        试试这个对照：把手劲固定在大大的 0.8，然后只把「耐心」从 1 拖到 4。
        同一双手、同一根管子，超调会从三十几度掉到六度 —— 你什么都没改，只是愿意等一等。
      </div>
    </div>
  );
}
