/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    qualities: [25, 50 ,75, 85],

  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              // Dev websockets and local Supabase/Next endpoints, plus VA script connections
              "connect-src 'self' http://127.0.0.1:54321 http://localhost:54321 http://127.0.0.1:3000 http://localhost:3000 ws: wss: https://va.vercel-scripts.com",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              // Allow Next.js dev runtime + next-themes inline init; include VA domain for script loading
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://va.vercel-scripts.com",
              // Explicitly allow external script elements loaded by the app
              "script-src-elem 'self' 'unsafe-inline' blob: https://va.vercel-scripts.com",
              "manifest-src 'self'",
              "worker-src 'self' blob:"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

export default nextConfig
