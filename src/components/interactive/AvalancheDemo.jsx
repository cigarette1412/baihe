import { useState, useMemo } from 'react';
import { sha256Hex, sha256Bits } from '../../lib/sha256.js';

const BASE_DEFAULT = 'baihe.org';
const MUT_DEFAULT = 'baihe.orh';
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function countDiff(a, b) {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
}

function mutateOneChar(s) {
  if (!s.length) return s;
  const i = Math.floor(Math.random() * s.length);
  const c = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s.slice(0, i) + c + s.slice(i + 1);
}

export default function AvalancheDemo() {
  const [base, setBase] = useState(BASE_DEFAULT);
  const [mut, setMut] = useState(MUT_DEFAULT);
  const [hist, setHist] = useState(null);

  const baseBits = useMemo(() => sha256Bits(base), [base]);
  const mutBits = useMemo(() => sha256Bits(mut), [mut]);
  const flipped = useMemo(() => countDiff(baseBits, mutBits), [baseBits, mutBits]);
  const pct = ((flipped / 256) * 100).toFixed(1);

  const runExperiment = () => {
    const ref = sha256Bits(base);
    const counts = [];
    for (let k = 0; k < 500; k++) {
      counts.push(countDiff(ref, sha256Bits(mutateOneChar(base))));
    }
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const NB = 24;
    const buckets = new Array(NB).fill(0);
    for (const c of counts) {
      const idx = Math.min(NB - 1, Math.floor(((c - min) / (max - min + 1)) * NB));
      buckets[idx]++;
    }
    setHist({ buckets, min, max, avg, n: counts.length });
  };

  const cell = (i) =>
    baseBits[i] !== mutBits[i] ? '#c0473a' : mutBits[i] ? '#cfcdc5' : '#ecebe5';

  return (
    <div className="demo">
      <div className="demo-title">演示 1 · 雪崩效应（真实 SHA-256）</div>

      <div className="row" style={{ marginBottom: '.6rem' }}>
        <span className="stat" style={{ width: '4.2rem' }}>原文</span>
        <input
          className="text-input"
          style={{ flex: '1 1 14rem' }}
          value={base}
          onChange={(e) => setBase(e.target.value)}
          spellCheck="false"
        />
      </div>
      <div className="row">
        <span className="stat" style={{ width: '4.2rem' }}>改一处</span>
        <input
          className="text-input"
          style={{ flex: '1 1 14rem', borderColor: '#c0473a' }}
          value={mut}
          onChange={(e) => setMut(e.target.value)}
          spellCheck="false"
        />
      </div>

      <div className="row" style={{ marginTop: '.8rem' }}>
        <button className="ghost" onClick={() => setMut(mutateOneChar(base))}>
          随机改一个字符
        </button>
        <button className="ghost" onClick={runExperiment}>
          重复 500 次并统计
        </button>
      </div>

      <div style={{ margin: '1rem 0 .6rem' }}>
        <div className="stat">
          输出翻转了 <b>{flipped}</b> / 256 位（<b>{pct}%</b>）
          <span style={{ color: '#8a8a83' }}> — 理想值是 50%</span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(32, 1fr)',
          gap: '2px',
          margin: '.4rem 0 .9rem',
        }}
      >
        {Array.from({ length: 256 }, (_, i) => (
          <div key={i} style={{ aspectRatio: '1', borderRadius: '2px', background: cell(i) }} />
        ))}
      </div>

      <div style={{ fontFamily: 'var(--mono)', fontSize: '.74rem', lineHeight: 1.9, wordBreak: 'break-all' }}>
        <div style={{ color: '#8a8a83' }}>原文　{sha256Hex(base)}</div>
        <div>
          改后　{sha256Hex(mut).split('').map((ch, i) => {
            const changed = sha256Hex(base)[i] !== ch;
            return (
              <span key={i} style={changed ? { color: '#c0473a', fontWeight: 600 } : { color: '#8a8a83' }}>
                {ch}
              </span>
            );
          })}
        </div>
      </div>

      {hist && (
        <div style={{ marginTop: '1.1rem', borderTop: '1px solid #e6e4de', paddingTop: '.9rem' }}>
          <div className="stat" style={{ marginBottom: '.5rem' }}>
            随机改动 {hist.n} 次，每次翻转位数：最少 <b>{hist.min}</b>，最多{' '}
            <b>{hist.max}</b>，平均 <b>{hist.avg.toFixed(1)}</b>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '76px' }}>
            {hist.buckets.map((v, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: '#2b5c4e',
                  height: `${Math.max(2, (v / Math.max(...hist.buckets)) * 100)}%`,
                  borderRadius: '2px 2px 0 0',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: '#8a8a83' }}>
            <span>{hist.min}</span>
            <span>翻转位数 →</span>
            <span>{hist.max}</span>
          </div>
        </div>
      )}

      <div className="demo-note">
        红格 = 因你改动一个字符而翻转的比特位。无论改的是第一个字母还是最后一个，
        翻转数都稳定落在 128 附近——这就是「雪崩」。
      </div>
    </div>
  );
}
