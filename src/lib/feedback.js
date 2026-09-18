// 带延迟的负反馈回路：淋浴水温模型。
// T 是实际水温，s 是旋钮位置，你能感知的是 delay 步之前的温度。
// damping 是「预判」项（PID 里的 D）：看误差的变化趋势提前刹车。

export function simulate({
  alpha = 0.25,    // 管道响应速度：实际水温向旋钮值靠拢的快慢
  delay = 3,       // 感知延迟（步）：热水从热水器走到你身上要多久
  gain = 0.5,      // 手劲：看到偏差时一次拧多大
  patience = 1,    // 耐心：每隔几步才动一次手（其余时间把手拿开）
  steps = 90,
  target = 40,
  start = 20,
} = {}) {
  const series = [];
  const knob = [];
  const perceivedSeries = [];
  let T = start;
  let s = start;

  for (let n = 0; n < steps; n++) {
    const perceived = n >= delay ? series[n - delay] : start;
    const err = target - perceived;

    if (n % patience === 0) {
      s = Math.max(0, Math.min(100, s + gain * err));
    }
    T = T + alpha * (s - T);

    series.push(T);
    knob.push(s);
    perceivedSeries.push(perceived);
  }
  return { series, knob, perceivedSeries, target, start };
}

export function metrics(series, target) {
  const peak = Math.max(...series);
  const trough = Math.min(...series);
  const tail = series.slice(-20);
  const ripple = Math.max(...tail) - Math.min(...tail);
  // 数一数穿过目标线的次数：穿得越多，说明来回摆动越厉害
  let crossings = 0;
  for (let i = 1; i < series.length; i++) {
    if ((series[i - 1] - target) * (series[i] - target) < 0) crossings++;
  }
  return {
    peak,
    trough,
    overshoot: peak - target,
    ripple,
    crossings,
    settled: ripple < 1.2,
  };
}
