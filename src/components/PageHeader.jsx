import React from 'react';

/**
 * Sayfa başlığı için sade, tekrar kullanılabilir header.
 */
export default function PageHeader({ title, description }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-heading tracking-tight leading-tight">{title}</h1>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
      )}
    </header>
  );
}