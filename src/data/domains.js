export const domains = {
  physics: {
    name: '物理',
    en: 'Physics',
    desc: '世界如何运作：从一颗石头的落地，到一只猫的生死叠加。',
  },
  math: {
    name: '数学',
    en: 'Mathematics',
    desc: '不是算得快，而是看穿结构。每一个公式背后都有一条必须如此的道理。',
  },
  computing: {
    name: '计算',
    en: 'Computing',
    desc: '把黑盒拆开：算法、密码、系统里那些被一行代码藏起来的原理。',
  },
  philosophy: {
    name: '哲学',
    en: 'Philosophy',
    desc: '在追问答案之前，先追问这个问题到底在问什么。',
  },
  crosscutting: {
    name: '横切原理',
    en: 'Cross-cutting',
    desc: '熵、守恒、反馈、涌现、尺度——那些不属于任何学科，却在所有学科里反复出现的同一批道理。',
  },
};

export const domainList = Object.entries(domains).map(([slug, d]) => ({ slug, ...d }));

export const levelLabel = {
  1: 'L1 · 直觉版',
  2: 'L2 · 标准版',
  3: 'L3 · 推导版',
};
