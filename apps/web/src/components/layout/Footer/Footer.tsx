// ═══════════════════════════════════════════════════════════════
// Global Layout Footer
// Minimalist, accessible, static information links
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`${styles.container} container`}>
        <div className={styles.copyright}>
          &copy; {currentYear} NexaStore. All rights reserved.
        </div>
        <div className={styles.links}>
          <Link href="/terms" className={styles.link}>
            Terms of Service
          </Link>
          <Link href="/privacy" className={styles.link}>
            Privacy Policy
          </Link>
          <Link href="/faqs" className={styles.link}>
            FAQs
          </Link>
        </div>
      </div>
    </footer>
  );
};
