import { useState, useMemo } from 'react';

const BASE0 = 0x6a09e667;

// 教学用的简化混合函数：每轮把差异向两侧推开一点。
// 真实 SHA-256 的每一轮更强、共 64 轮，但扩散的道理完全一样。
function step(s) {
  const t = (s ^ (s >>> 1)) >>> 0;
  return (t ^ (t << 2)) >>> 0;
}

function popcount(x) {
  let c = 0;
  while (x) { c += x & 1; x >>>= 1; }
  return c;
}

export default function DiffusionDemo() {
  const [flipIndex, setFlipIndex] = useState(16);
  const [rounds, setRounds] = useState(10);

  const rows = useMemo(() => {
    const mut0 = (BASE0 ^ (1 << (31 - flipIndex))) >>> 0;
    let a = BASE0 >>> 0;
    let b = mut0;
    const out = [];
    for (let r = 0; r < rounds; r++) {
      a = step(a);
      b = step(b);
      const d = (a ^ b) >>> 0;
      out.push({
        bits: Array.from({ length: 32 }, (_, i) => (d >>> (31 - i)) & 1),
        count: popcount(d),
      });
    }
    return out;
  }, [flipIndex, rounds]);

  const last = rows[rows.length - 1];

  return (
    <div className="demo">
      <div className="demo-title">演示 2 · 扩散是怎么长出来的</div>

      <div style={{ fontSize: '.84rem', color: '#4a4a46', marginBottom: '.5rem' }}>
        点下面任意一位，把它翻转（只翻这一位），然后看差异如何随轮数蔓延：
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(32, 1fr)', gap: '2px', marginBottom: '.9rem' }}>
        {Array.from({ length: 32 }, (_, i) => {
          const on = i === flipIndex;
          return (
            <div
              key={i}
              onClick={() => setFlipIndex(i)}
              title={`第 ${i + 1} 位`}
              style={{
                aspectRatio: '1',
                borderRadius: '2px',
                cursor: 'pointer',
                background: on ? '#c0473a' : '#ecebe5',
                border: on ? '1px solid #c0473a' : '1px solid transparent',
              }}
            />
          );
        })}
      </div>

      <div className="row" style={{ marginBottom: '.8rem' }}>
        <span className="stat">混合轮数</span>
        <input
          type="range"
          min="1"
          max="16"
          value={rounds}
          onChange={(e) => setRounds(Number(e.target.value))}
          style={{ flex: '1 1 10rem', accentColor: '#2b5c4e' }}
        />
        <span className="stat" style={{ fontVariantNumeric: 'tabular-nums' }}>{rounds} 轮</span>
      </div>

      <div style={{ fontSize: '.8rem', color: '#8a8a83', display: 'grid', gridTemplateColumns: '2.6rem 1fr 3rem', gap: '.4rem', marginBottom: '.3rem' }}>
        <span>轮</span>
        <span>32 个输出位中，受影响的位</span>
        <span style={{ textAlign: 'right' }}>合计</span>
      </div>

      {rows.map((row, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: '2.6rem 1fr 3rem',
            gap: '.4rem',
            alignItems: 'center',
            marginBottom: '2px',
          }}
        >
          <span style={{ fontSize: '.72rem', color: '#8a8a83', fontVariantNumeric: 'tabular-nums' }}>
            第 {r + 1} 轮
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(32, 1fr)', gap: '2px' }}>
            {row.bits.map((b, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '1',
                  borderRadius: '2px',
                  background: b ? '#c0473a' : '#ecebe5',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: '.75rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: row.count >= 14 ? '#c0473a' : '#4a4a46' }}>
            {row.count}/32
          </span>
        </div>
      ))}

      <div className="demo-note">
        第 1 轮时只有孤零零一个点。跑到第 {rounds} 轮，已经有 <b>{last.count}</b> / 32
        个输出位被这一个输入位改写。当所有位都被改写、且改写方向接近随机时，
        你就再也看不出「原文改了哪一位」——这就是哈希的单向性来源。
      </div>
    </div>
  );
}
