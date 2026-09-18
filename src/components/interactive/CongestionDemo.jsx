import { useState, useMemo } from 'react';
import { simulate, metrics } from '../../lib/congestion.js';
import Slider from './Slider.jsx';

const STEPS = 120;

const PRESETS = [
  { key: 'aimd', label: '标准 AIMD', p: { capacity: 20, queueCap: 20, delay: 1, aimd: true } },
  { key: 'off', label: '关掉拥塞控制', p: { capacity: 20, queueCap: 20, delay: 1, aimd: false } },
  { key: 'buffer', label: '超大缓冲', p: { capacity: 20, queueCap: 200, delay: 1, aimd: true } },
  { key: 'rtt', label: '长 RTT', p: { capacity: 20, queueCap: 20, delay: 4, aimd: true } },
];

function Panel({ title, series, max, color, reference, refLabel, height = 130 }) {
  const yOf = (v) => height - 22 - (Math.min(v, max) / max) * (height - 34);
  const xOf = (i) => (i / (series.length - 1)) * 600;
  const d = series
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)}`)
    .join(' ');

  return (
    <div style={{ marginBottom: '.5rem' }}>
      <div style={{ fontSize: '.74rem', color: '#8a8a83', marginBottom: '.2rem' }}>{title}</div>
      <svg viewBox={`0 0 600 ${height}`} width="100%" style={{ display: 'block', background: '#fff', borderRadius: '8px', border: '1px solid #e6e4de' }}>
        {reference !== undefined && (
          <>
            <line x1="0" y1={yOf(reference)} x2="600" y2={yOf(reference)} stroke="#2b5c4e" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x="596" y={yOf(reference) - 5} fontSize="10" fill="#2b5c4e" textAnchor="end">{refLabel}</text>
          </>
        )}
        <path d={d} fill="none" stroke={color} strokeWidth="2" />
        <text x="4" y="14" fontSize="10" fill="#b4b2a9">{max.toFixed(0)}</text>
      </svg>
    </div>
  );
}

export default function CongestionDemo() {
  const [params, setParams] = useState({ capacity: 20, queueCap: 20, delay: 1, aimd: true });

  const run = useMemo(() => simulate({ ...params, steps: STEPS }), [params]);
  const m = useMemo(() => metrics(run), [run]);

  const set = (k) => (v) => setParams((p) => ({ ...p, [k]: v }));
  const maxCwnd = Math.max(20, ...run.cwndSeries);

  return (
    <div className="demo">
      <div className="demo-title">演示 · 一条瓶颈链路上的 120 个往返</div>

      <div style={{ marginBottom: '.8rem' }}>
        <Slider label="链路容量" value={params.capacity} min={5} max={40} step={1} onChange={set('capacity')} hint={`${params.capacity} 包`} />
        <Slider label="路由器缓冲" value={params.queueCap} min={5} max={300} step={5} onChange={set('queueCap')} hint={`${params.queueCap} 包`} />
        <Slider label="反馈延迟" value={params.delay} min={1} max={5} step={1} onChange={set('delay')} hint={`${params.delay} 轮`} />
      </div>

      <div className="row" style={{ marginBottom: '.9rem' }}>
        {PRESETS.map((p) => (
          <button key={p.key} className="ghost" onClick={() => setParams(p.p)}>
            {p.label}
          </button>
        ))}
        <button
          className={params.aimd ? '' : 'ghost'}
          onClick={() => setParams((p) => ({ ...p, aimd: !p.aimd }))}
        >
          拥塞控制：{params.aimd ? '开' : '关'}
        </button>
      </div>

      <Panel
        title="拥塞窗口 cwnd（发送方一次能发多少未确认的包）"
        series={run.cwndSeries}
        max={maxCwnd}
        color="#1c1c1a"
      />
      <Panel
        title="有效吞吐（真正送到的新数据）"
        series={run.goodputSeries}
        max={params.capacity * 1.25}
        color="#1c1c1a"
        reference={params.capacity}
        refLabel="链路容量"
      />

      <div className="row" style={{ marginTop: '.5rem', gap: '1.1rem' }}>
        <span className="stat">
          有效吞吐 <b>{m.goodput.toFixed(1)}</b> / {params.capacity}
        </span>
        <span className="stat">
          效率 <b style={{ color: m.efficiency > 0.8 ? '#2b5c4e' : '#c0473a' }}>{(m.efficiency * 100).toFixed(0)}%</b>
        </span>
        <span className="stat">
          丢包率 <b style={{ color: m.loss > 0.2 ? '#c0473a' : '#4a4a46' }}>{(m.loss * 100).toFixed(0)}%</b>
        </span>
        <span className="stat">
          排队延迟 <b style={{ color: m.queueDelay > 2 ? '#c0473a' : '#4a4a46' }}>{m.queueDelay.toFixed(1)} 轮</b>
        </span>
      </div>

      <div className="demo-note">
        先点「关掉拥塞控制」：窗口一路涨到 120，丢包率冲到 80%，而真正送到的新数据反而只剩下五分之一 ——
        带宽全被重传的包吃掉了。这就是 1986 年互联网真的死过一次的原因。
        再点「超大缓冲」：吞吐漂亮地跑满了，但排队延迟飙到 7 个往返 —— 这就是 bufferbloat，
        网速看起来很好，可你打游戏卡得要命。
      </div>
    </div>
  );
}
