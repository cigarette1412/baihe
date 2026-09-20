# 上线清单

站点产物是纯静态文件（`dist/`），任何静态托管都能跑。**在你说"可以上线"之前，请照着这份清单过一遍。**

## 一、上线前必须确认的三件事

| # | 事项 | 状态 |
|---|---|---|
| 1 | 站名确认为「白盒」（当前全站、README、commit 信息均已用此名） | ☐ |
| 2 | GitHub 仓库已建好，本地已 `git remote add` 并 push | ☐ |
| 3 | `astro.config.mjs` 的 `site` 已改为最终线上地址 | ☐ |

## 二、推荐方案：Cloudflare Pages

理由：国内访问稳定、免费额度足够、自动 HTTPS、绑定自有域名简单。

1. 把仓库推到 GitHub；
2. Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git；
3. 构建配置：
   - Framework preset：`Astro`
   - Build command：`npm run build`
   - Build output directory：`dist`
   - Node version：`22`
4. 部署完成后绑定域名 `baihe.org`：
   - Custom domains → 添加 `baihe.org` 与 `www.baihe.org`
   - 按提示把域名的 NS 记录指向 Cloudflare（若域名原本不在 Cloudflare 托管）
5. 打开 `https://baihe.org/sitemap.xml` 确认能访问。

**不要用 Vercel**：国内访问不稳定。

备选 GitHub Pages：免费、和仓库天然一体，但国内访问速度一般，且需要给 `site` 配 `base`（若用 `username.github.io` 以外的子路径）。

## 三、关于域名与备案

- `baihe.org` 是境外注册局的域名，**不需要 ICP 备案**；
- 但如果你把托管选在**中国大陆境内**的服务商（如阿里云 OSS 静态托管、腾讯云 EdgeOne 国内节点），则**必须备案**；
- 用 Cloudflare Pages / GitHub Pages 这类境外托管 + `.org` 域名，可以绕过备案，代价是国内部分网络访问速度波动。
- 若域名尚未购买，`.org` 一年通常在 ¥80–120。

## 四、上线后立刻做的检查

```
☐ 首页、5 个领域页、4 篇文章页全部 200
☐ 交互演示能正常拨动（哈希的雪崩、淋浴水温、拥塞窗口、傅里叶本轮）
☐ KaTeX 公式正常渲染（不是显示成源码）
☐ 手机上看一遍：目录折叠、公式不溢出、演示可操作
☐ https://baihe.org/sitemap.xml 可访问
☐ 用手机浏览器打开一篇文章，复制链接发到微信，看分享卡片是否正常
☐ Google Search Console 提交 sitemap
```

## 五、当前站点状态（用于验收对照）

- 页面：10 个 HTML（首页 + 5 领域页 + 4 文章页）
- 文章：哈希（计算）、反馈（横切原理）、拥塞控制（计算）、傅里叶（物理）
- 交互组件：5 个
- 待补：数学、哲学两个领域还没有文章

## 六、已知待办

- ☐ 站名确认（若不是「白盒」，全站替换）
- ☐ GitHub 远端地址
- ☐ 数学领域首篇
- ☐ 哲学领域首篇
