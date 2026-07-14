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
          ← Minispiele
        </Link>
      )}
      {children}
    </div>
  );
}
