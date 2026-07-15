import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  showBack?: boolean;
}

export function Layout({ children, showBack = true }: LayoutProps) {
  return (
    <div className="layout">
      {showBack && (
        <Link to="/" className="layout-back">
          <span className="layout-back-arrow" aria-hidden="true" />
          Mini Games
        </Link>
      )}
      <main className="layout-main">{children}</main>
      <footer className="layout-footer">
        Eine Seite von{' '}
        <a
          href="https://www.onborthmedia.de"
          target="_blank"
          rel="noopener noreferrer"
        >
          onborthmedia
        </a>
      </footer>
    </div>
  );
}
