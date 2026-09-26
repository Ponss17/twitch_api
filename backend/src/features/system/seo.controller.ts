import { Request, Response } from 'express';
import { CONFIG } from '../../core/config/env';

/** Origen público del sitio (sin el sufijo /api de BASE_URL). */
function publicSiteOrigin(): string {
    const explicit = (CONFIG.FRONTEND_URL || '').replace(/\/$/, '');
    if (explicit) return explicit;
    try {
        return new URL(CONFIG.BASE_URL).origin;
    } catch {
        return 'https://ttv.losperris.dev';
    }
}

export const getRobotsTxt = (req: Request, res: Response): void => {
    const site = publicSiteOrigin();
    const robotsContent = `User-agent: *
Allow: /
Sitemap: ${site}/sitemap.xml`;

    res.header('Content-Type', 'text/plain');
    res.header('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.send(robotsContent);
};

export const getSitemapXml = (req: Request, res: Response): void => {
    const baseUrl = publicSiteOrigin();

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
  <url>
    <loc>${baseUrl}/about</loc>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/legal</loc>
    <priority>0.5</priority>
  </url>
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
    res.send(sitemapContent);
};
