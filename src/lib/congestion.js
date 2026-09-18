// TCP 拥塞控制：AIMD（加性增、乘性减）与拥塞崩溃。
// 每「轮」= 一个 RTT。发送方发出 cwnd 个包，经过瓶颈链路，
// 超出缓冲的被丢弃，丢弃的包需要重传 —— 重传会挤占本该送新数据的带宽，
// 这就是 1986 年那场拥塞崩溃的机制。

export function simulate({
  capacity = 20,     // 瓶颈链路每轮能交付多少包
  queueCap = 20,     // 路由器缓冲区能排多少包
  delay = 1,         // 反馈延迟（轮）：多久之后才知道发生了丢包
  aimd = true,       // 是否启用拥塞控制（乘性减）
  steps = 120,
  startCwnd = 1,
} = {}) {
  let cwnd = startCwnd;
  let queue = 0;
  let outstanding = 0; // 已发出但丢了、等待重传的包

  const cwndSeries = [];
  const goodputSeries = [];
  const queueSeries = [];
  const lossSeries = [];
  const dropHistory = [];

  for (let n = 0; n < steps; n++) {
    const space = Math.max(1, Math.round(cwnd));
    const retrans = Math.min(space, Math.round(outstanding));
    const fresh = space - retrans;
    outstanding -= retrans;

    const arrive = space + queue;
    const drop = Math.max(0, arrive - queueCap);
    const admitted = arrive - drop;
    const served = Math.min(capacity, admitted);
    const lossRate = arrive > 0 ? drop / arrive : 0;

    // 被丢的包（无论新数据还是重传）都得重传
    outstanding += (retrans + fresh) * lossRate;

    // 瓶颈每轮只能交付 served 个包；新数据只能分到「剔除重传后」的那份份额
    const deliveredFresh = served * (space > 0 ? fresh / space : 0);

    queue = admitted - served;
    dropHistory.push(drop);

    cwndSeries.push(space);
    goodputSeries.push(deliveredFresh);
    queueSeries.push(queue);
    lossSeries.push(lossRate);

    // 发送方根据「delay 轮之前」的丢包情况调整窗口
    const pastDrop = n - delay >= 0 ? dropHistory[n - delay] : 0;
    if (aimd) {
      if (pastDrop > 0) cwnd = Math.max(1, cwnd / 2); // 乘性减
      else cwnd += 1; // 加性增
    } else {
      cwnd += 1; // 没有拥塞控制：一路加码，永不后退
    }
  }

  return { cwndSeries, goodputSeries, queueSeries, lossSeries, capacity, queueCap };
}

export function metrics(run, { tail = 40 } = {}) {
  const g = run.goodputSeries.slice(-tail);
  const q = run.queueSeries.slice(-tail);
  const l = run.lossSeries.slice(-tail);
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  return {
    goodput: avg(g),
    queue: avg(q),
    queueDelay: avg(q) / run.capacity,
    loss: avg(l),
    efficiency: avg(g) / run.capacity,
    finalCwnd: run.cwndSeries[run.cwndSeries.length - 1],
  };
}
