import React from 'react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function History() {
  return (
    <div>
      <PageHeader title="Geçmiş" />
      <EmptyState
        title="Henüz tamamlanmış antrenman bulunmuyor."
        description="Tamamladığın antrenmanlar burada geçmiş olarak listelenecek."
      />
    </div>
  );
}