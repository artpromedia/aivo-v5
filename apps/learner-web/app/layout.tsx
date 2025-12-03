import '../styles/globals.css';
import type { ReactNode } from 'react';
import { ThemeWrapper } from './ThemeWrapper';
import { BottomNavigation } from '../components';
import { FocusMonitorProvider } from '../components/providers';
import { CalmCornerFabWrapper } from './CalmCornerFabWrapper';

export const metadata = {
  title: 'AIVO Learner',
  description: 'Neurodiverse-friendly personalized AI tutor',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <ThemeWrapper>
          <FocusMonitorProvider>
            {children}
            <CalmCornerFabWrapper />
            <BottomNavigation />
          </FocusMonitorProvider>
        </ThemeWrapper>
      </body>
    </html>
  );
}
