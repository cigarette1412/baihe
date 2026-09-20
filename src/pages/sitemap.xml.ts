import { getCollection } from 'astro:content';
import { domainList } from '../data/domains.js';

// 静态端点：构建时生成 sitemap.xml，供搜索引擎与本地校验使用
export async function GET({ site }) {
  const base = (site || 'https://baihe.org').href.replace(/\/$/, '');
  const articles = await getCollection('articles');

  const entries = [
    { loc: `${base}/`, priority: '1.0', changefreq: 'weekly' },
    ...domainList.map((d) => ({
      loc: `${base}/domains/${d.slug}/`,
      priority: '0.7',
      changefreq: 'weekly',
    })),
    ...articles.map((a) => ({
      loc: `${base}/articles/${a.id}/`,
      lastmod: new Date(a.data.pubDate).toISOString().slice(0, 10),
      priority: '0.9',
      changefreq: 'monthly',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
