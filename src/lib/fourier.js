// 傅里叶级数：把周期波形分解成一组整数倍频率的正弦波。
// 每个谐波 = 一个以 n 倍频旋转的小圆（本轮），把所有圆首尾相接，
// 笔尖的纵坐标就是合成波形在该时刻的值。

export function coeffs(wave, maxN) {
  const out = [];
  for (let n = 1; n <= maxN; n++) {
    let amp = 0;
    if (wave === 'square') {
      // 方波只含奇次谐波，幅度 1/n
      if (n % 2 === 1) amp = 4 / (Math.PI * n);
    } else if (wave === 'saw') {
      // 锯齿波含全部谐波，幅度 1/n（取负号让斜坡从 -1 升到 1）
      amp = -2 / (Math.PI * n);
    } else if (wave === 'triangle') {
      // 三角波只含奇次谐波，幅度 1/n²，衰减快得多
      if (n % 2 === 1) {
        const k = (n - 1) / 2;
        amp = (8 / (Math.PI * Math.PI * n * n)) * (k % 2 === 0 ? 1 : -1);
      }
    }
    if (amp !== 0) out.push({ n, amp });
  }
  return out;
}

// 合成波形在时刻 t 的值（sin 基，值域约 ±1）
export function synthesize(list, t) {
  let v = 0;
  for (const h of list) v += h.amp * Math.sin(h.n * t);
  return v;
}

export function target(wave, t) {
  const x = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  if (wave === 'square') return x < Math.PI ? 1 : -1;
  if (wave === 'saw') return x / Math.PI - 1; // 从 -1 线性升到 1，在右端跳回
  if (wave === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(x)); // 0 → 1 → 0 → -1 → 0
  return 0;
}

// 均方根误差与吉布斯过冲（在跳变处，有限项叠加会冲过头且不会消失）
export function errorStats(wave, list, samples = 400) {
  let sq = 0;
  let peak = 0;
  for (let i = 0; i < samples; i++) {
    const t = ((i + 0.5) / samples) * 2 * Math.PI;
    const v = synthesize(list, t);
    const d = v - target(wave, t);
    sq += d * d;
    peak = Math.max(peak, Math.abs(v));
  }
  return { rmse: Math.sqrt(sq / samples), peak, overshoot: Math.max(0, peak - 1) * 100 };
}
