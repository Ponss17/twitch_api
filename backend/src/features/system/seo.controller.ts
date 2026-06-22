import { Request, Response } from 'express';
import { CONFIG } from '../../core/config/env';

export const getRobotsTxt = (req: Request, res: Response): void => {
    const robotsContent = `User-agent: *
Allow: /
Sitemap: ${CONFIG.BASE_URL}/sitemap.xml`;

    res.header('Content-Type', 'text/plain');
    res.header('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.send(robotsContent);
};

export const getSitemapXml = (req: Request, res: Response): void => {
    const baseUrl = CONFIG.BASE_URL.replace(/\/$/, '');

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/docs</loc>
    <priority>0.8</priority>
  </url>
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.send(sitemapContent);
};
