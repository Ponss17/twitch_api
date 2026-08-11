import fs from 'node:fs';
import path from 'node:path';

describe('vercel dashboard SPA rewrite', () => {
    const vercel = JSON.parse(
        fs.readFileSync(path.join(__dirname, '../../../vercel.json'), 'utf8')
    ) as {
        trailingSlash?: boolean;
        rewrites?: Array<{ source: string; destination: string }>;
    };

    it('usa /dashboard/(.*) para nested refresh (no :path*)', () => {
        expect(vercel.trailingSlash).toBe(true);
        const spa = vercel.rewrites?.find((r) => r.destination === '/dashboard/index.html');
        expect(spa?.source).toBe('/dashboard/(.*)');
        expect(vercel.rewrites?.some((r) => r.source === '/dashboard/:path*' && r.destination === '/dashboard/index.html')).toBe(
            false
        );
    });
});
