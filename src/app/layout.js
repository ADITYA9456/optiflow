import { Manrope, Space_Grotesk } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const headingFont = Manrope({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const bodyFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'OptiFlow AI — Productivity Intelligence Platform',
    template: '%s · OptiFlow AI',
  },
  description:
    'AI-powered SaaS platform combining task execution, team chat, promotion prediction, and manager analytics in one premium workspace.',
  keywords: ['OptiFlow AI', 'productivity SaaS', 'task management', 'team chat', 'promotion prediction', 'workplace AI'],
  applicationName: 'OptiFlow AI',
  authors: [{ name: 'OptiFlow AI Team' }],
  openGraph: {
    title: 'OptiFlow AI — Productivity Intelligence Platform',
    description:
      'Jira + Slack + AI Promotion Predictor — one premium SaaS workspace built for high-performing teams.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f7fb' },
    { media: '(prefers-color-scheme: dark)', color: '#050816' },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <body className={`${headingFont.variable} ${bodyFont.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
