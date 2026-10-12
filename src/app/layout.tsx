import type { Metadata } from 'next';
import './globals.css';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import Providers from '@/components/Providers';

const ibmSans = IBM_Plex_Sans({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-sans' });
const ibmMono = IBM_Plex_Mono({ weight: ['400', '500'], subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'Interview Prep Tracker',
  description: 'Smart Interview Preparation Tracker — Career Readiness Dashboard with AI coaching, spaced revision, and mistake analysis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmSans.variable} ${ibmMono.variable}`}>
      <head>
      </head>
      <body className="antialiased selection:bg-accent/30 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
