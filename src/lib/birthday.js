// 生日悖论 / 碰撞问题的精确数值工具
//
// 模型：从 d 个等可能的结果里独立抽取 n 次，「至少有两抽撞在一起」的概率。
//   d = 365  → 生日问题（23 人就过半）
//   d = 2^32 → 32 位哈希（77163 次就过半）
//   d = 2^128 → 128 位 UUID（约 2.2×10^19 次才过半）
//
// 关键结论：所需次数按 √d 增长，不是按 d 增长。这是全篇的反直觉核心。

/** 精确碰撞概率：P = 1 - Π_{i=0}^{n-1} (d - i)/d
 *  用对数累加避免大 d 时的浮点下溢 */
// Lanczos 近似的对数伽马函数，用于中等规模 d 的闭式计算
function lgamma(x) {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = p[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += p[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

// 注意：绝不能对任意 n 直接循环累加 —— d=2^128 时 n 可达 10^19 量级，会当场卡死。
// 按规模分三条路走：
//   ① n 小 → 逐项累加，精确
//   ② n 大但远小于 d → 级数展开（生日攻击场景，误差 < 1e-6）
//   ③ n 大且接近 d → lgamma 闭式
const LOOP_LIMIT = 5000;

export function collisionProb(d, n) {
  if (n <= 1) return 0;
  if (n > d) return 1; // 鸽巢原理：硬性保证

  if (n <= LOOP_LIMIT) {
    let logNoCollision = 0;
    for (let i = 0; i < n; i++) logNoCollision += Math.log1p(-i / d);
    return -Math.expm1(logNoCollision);
  }

  if (n / d < 0.05) {
    // ln P(无碰撞) = Σ ln(1 - i/d) ≈ -n(n-1)/(2d) - n(n-1)(2n-1)/(12d²)
    const t1 = (n * (n - 1)) / (2 * d);
    const t2 = (n * (n - 1) * (2 * n - 1)) / (12 * d * d);
    return -Math.expm1(-t1 - t2);
  }

  // 闭式：ln P(无碰撞) = lgamma(d+1) - lgamma(d-n+1) - n·ln d
  return -Math.expm1(lgamma(d + 1) - lgamma(d - n + 1) - n * Math.log(d));
}

/** 常用近似：P ≈ 1 - e^{-n(n-1)/(2d)}，小 n/d 时很准 */
export function approxProb(d, n) {
  return -Math.expm1((-n * (n - 1)) / (2 * d));
}

/** 达到给定碰撞概率所需的最少抽取次数（二分求解，n 可能极大） */
export function requiredForProb(d, p = 0.5) {
  if (p <= 0) return 1;
  let lo = 1;
  let hi = 2;
  // 先指数扩张上界。注意上界要足够大：256 位空间的 n50 是 10^38 量级，
  // 用一个偏小的上限（如 1e30）会把答案截断成错值。
  while (collisionProb(d, hi) < p && hi < 1e300) {
    hi *= 2;
  }

  // 规模允许时走整数二分，保证返回的是「达标的最小整数」
  if (hi <= 1e7) {
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      if (collisionProb(d, mid) < p) lo = mid;
      else hi = mid;
    }
    return collisionProb(d, lo) >= p ? lo : hi;
  }

  // 大数：用相对精度收敛，而不是绝对差 1 ——
  // 量级到 10^38 时双精度的相邻间隔本身就有 10^22，绝对差永远收敛不了，会死循环
  let iter = 0;
  while (hi - lo > hi * 1e-9 && iter++ < 300) {
    const mid = (lo + hi) / 2;
    if (collisionProb(d, mid) < p) lo = mid;
    else hi = mid;
  }
  return Math.round(hi);
}

/** 平方根律：n50 ≈ 1.17741 √d */
export function ruleOfThumb(d) {
  return 1.17741 * Math.sqrt(d);
}

/** 蒙特卡洛：跑若干轮实验，统计实际发生碰撞的比例
 *  只在 d 与 n 都不太大时有意义（大空间下撞不上，模拟纯属浪费） */
export function simulate(d, n, trials = 400, seed = 1) {
  // 空间太大就别模拟了 —— 撞不上，纯属白烧 CPU。直接返回理论值。
  if (n > 200000 || d > 1e9) {
    return { rate: collisionProb(d, n), hits: 0, trials: 0, analytic: true };
  }
  // 固定种子的 LCG，保证同一组参数每次结果一致，不会让读者以为数字在乱跳
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  let hits = 0;
  for (let t = 0; t < trials; t++) {
    const seen = new Set();
    let hit = false;
    for (let i = 0; i < n; i++) {
      const v = Math.floor(rand() * d);
      if (seen.has(v)) {
        hit = true;
        break;
      }
      seen.add(v);
    }
    if (hit) hits++;
  }
  return { rate: hits / trials, hits, trials };
}

/** 生成概率曲线数据点，供图表绘制 */
export function curve(d, maxN, samples = 160) {
  const points = [];
  const step = Math.max(1, Math.floor(maxN / samples));
  for (let n = 1; n <= maxN; n += step) {
    points.push({ n, p: collisionProb(d, n) });
  }
  if (points[points.length - 1].n !== maxN) {
    points.push({ n: maxN, p: collisionProb(d, maxN) });
  }
  return points;
}

/** 大数可读化：22,000,000,000 → 2.2×10^10 */
export function fmtBig(x) {
  if (x < 1000) return String(Math.round(x));
  if (x < 1e6) return Math.round(x).toLocaleString('en-US');
  const exp = Math.floor(Math.log10(x));
  const mant = x / Math.pow(10, exp);
  return `${mant.toFixed(1)}×10^${exp}`;
}

/** 预设场景：同一个公式，换一个 d 就是完全不同的世界 */
export const scenarios = [
  { key: 'birthday', label: '生日', d: 365, hint: '一年 365 天', unit: '人' },
  { key: 'crc32', label: '32 位校验', d: 4294967296, hint: '2³² ≈ 43 亿', unit: '个输入' },
  { key: 'md5', label: '128 位哈希', d: Math.pow(2, 128), hint: '2¹²⁸', unit: '个输入' },
  { key: 'uuid', label: '256 位哈希', d: Math.pow(2, 256), hint: '2²⁵⁶', unit: '个输入' },
];
