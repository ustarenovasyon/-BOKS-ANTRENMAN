import React from 'react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function Workout() {
  return (
    <div>
      <PageHeader title="Bugünkü Antrenman" />
      <EmptyState
        title="Başlatılabilir bir antrenman bulunmuyor."
        description="Aktif bir program olduğunda bugünkü antrenmanın burada görünecek."
      />
    </div>
  );
}