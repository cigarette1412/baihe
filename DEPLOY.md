# 上线清单

站点产物是纯静态文件（`dist/`），任何静态托管都能跑。**在你说"可以上线"之前，请照着这份清单过一遍。**

## 一、上线前必须确认的三件事

| # | 事项 | 状态 |
|---|---|---|
| 1 | 站名确认为「白盒」（全站、README、commit 信息均已用此名） | ☑ 已确认 2026-09-20 |
| 2 | GitHub 仓库已建好并推送 | ☑ 已推送 https://github.com/cigarette1412/baihe |
| 3 | `astro.config.mjs` 的 `site` 已改为最终线上地址 | ☑ 已填 https://baihe.org |

> 本机到 GitHub 的 443 端口不通（代理对 github.com 返回 502，直连超时），
> **只有 22 端口（SSH）可用**。所以 remote 配的是 `git@github.com:cigarette1412/baihe.git`，
> 后续提交一律走 SSH，不要切回 HTTPS。

## 二、推荐方案：Cloudflare Pages

理由：国内访问稳定、免费额度足够、自动 HTTPS、绑定自有域名简单。仓库已推送，可以直接连。

### A. 创建项目（约 2 分钟）

1. 打开 https://dash.cloudflare.com/ 并登录（没有账号就注册，免费）；
2. 左侧 **Workers & Pages** → **Create** → **Pages** 标签 → **Connect to Git**；
3. 选 **GitHub** → 授权 → 仓库选 `cigarette1412/baihe`
   （如果列表里看不到，点 *Configure GitHub access* 只勾选这一个仓库）；
4. **Begin setup**。

### B. 构建配置（填错这里会构建失败）

| 字段 | 填什么 |
|---|---|
| Project name | `baihe`（决定二级域名 `baihe.pages.dev`） |
| Production branch | `main` |
| Framework preset | `Astro` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/`（留空） |

展开 **Environment variables (advanced)**，加一条（防止默认 Node 过低）：

| Variable | Value |
|---|---|
| `NODE_VERSION` | `22` |

> 仓库里已放 `.nvmrc`（内容 `22`），双保险。Astro 5 要求 Node ≥ 18.20.8，
> Cloudflare 的默认版本偶尔会落到旧版，显式指定最省事。

点 **Save and Deploy**。首次构建约 1–2 分钟，成功后会给你 `https://baihe.pages.dev`。

### C. 绑定 baihe.org

先用 `pages.dev` 看一遍效果，确认没问题再绑域名（绑了之后 canonical 才完全对得上）。

1. 进项目 → **Custom domains** → **Set up a custom domain** → 填 `baihe.org`；
2. Cloudflare 会检测域名的 NS：
   - **已在 Cloudflare 托管** → 直接自动加 DNS 记录，等几分钟即可；
   - **不在**（在阿里云/腾讯云等）→ 它会给你两个 NS 地址，去你的域名商后台把
     **Nameserver 改成这两个**。生效要等 几小时（通常 1–2 小时，最长 48 小时）；
3. 再设一次 `www.baihe.org`，让 Cloudflare 自动 301 到主域名；
4. SSL/TLS 保持默认 **Full**，Cloudflare 会自动签证书（也是要等生效）。

**不要用 Vercel**：国内访问不稳定。

备选 GitHub Pages：免费、和仓库天然一体，但国内访问速度一般，且需要给 `site` 配 `base`（若用 `username.github.io` 以外的子路径）。

## 三、关于域名与备案

- `baihe.org` 是境外注册局的域名，**不需要 ICP 备案**；
- 但如果你把托管选在**中国大陆境内**的服务商（如阿里云 OSS 静态托管、腾讯云 EdgeOne 国内节点），则**必须备案**；
- 用 Cloudflare Pages / GitHub Pages 这类境外托管 + `.org` 域名，可以绕过备案，代价是国内部分网络访问速度波动。
- 若域名尚未购买，`.org` 一年通常在 ¥80–120。

## 四、上线后立刻做的检查

```
☐ 首页、5 个领域页、5 篇文章页全部 200
☐ 交互演示能正常拨动（哈希的雪崩、淋浴水温、拥塞窗口、傅里叶本轮、生日曲线）
☐ KaTeX 公式正常渲染（不是显示成源码）
☐ 手机上看一遍：目录折叠、公式不溢出、演示可操作
☐ https://baihe.org/sitemap.xml 可访问
☐ 访问一个不存在的地址，确认出现 404 页而不是 Cloudflare 默认报错
☐ 用手机浏览器打开一篇文章，复制链接发到微信，看分享卡片是否正常
☐ Google Search Console 提交 sitemap
```

> **以后怎么更新站点**：改完内容 → `git push` 到 main → Cloudflare 自动重新构建，
> 约 1–2 分钟后线上生效。不需要手动上传任何东西。

## 五、当前站点状态（用于验收对照）

- 页面：12 个 HTML（首页 + 5 领域页 + 5 文章页 + 404）
- 文章：哈希（计算）、反馈（横切原理）、拥塞控制（计算）、傅里叶（物理）、生日悖论（数学）
- 交互组件：6 个
- 待补：哲学领域还没有文章

## 六、已知待办

- ☑ ~~站名确认~~（已确认为「白盒」）
- ☑ ~~GitHub 远端地址~~（已推送，走 SSH）
- ☑ ~~页脚 PR 链接~~（已指向真实仓库，并加了 issue 入口）
- ☐ 哲学领域首篇（五个入口里唯一还空的）
- ☐ 五个领域的主题页（目前只有领域页，主题层尚未展开）
