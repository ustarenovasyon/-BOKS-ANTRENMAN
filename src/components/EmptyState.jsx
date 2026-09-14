import React from 'react';

/**
 * Veri olmadığında tutarlı, sahte olmayan boş durum gösterimi.
 */
export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-2">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}