import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";
import dns from 'node:dns';

// Windows ve bazı ağlarda "fetch failed" hatalarını önlemek için IPv4 zorunluluğu:
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default withNextIntl(nextConfig);
