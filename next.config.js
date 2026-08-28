/** @type {import('next').NextConfig} */

// Old domain(s) that must permanently redirect to the new domain.
// Matched against the request Host header, so only traffic arriving on the old
// domain is redirected — the new domain (trialseed.com.au) is never matched,
// which avoids redirect loops.
const OLD_HOSTS = ['oc-selective.com', 'www.oc-selective.com'];
const NEW_DOMAIN_URL = 'https://trialseed.com.au';

const nextConfig = {
  async redirects() {
    return OLD_HOSTS.map((host) => ({
      // `:path*` captures the full path (and query strings are preserved by
      // default), so e.g. /dashboard/writing/1 -> <new domain>/dashboard/writing/1.
      source: '/:path*',
      has: [{ type: 'host', value: host }],
      destination: `${NEW_DOMAIN_URL}/:path*`,
      // Explicit HTTP 301 (Next's `permanent: true` would emit a 308).
      statusCode: 301,
    }));
  },
};

export default nextConfig;
