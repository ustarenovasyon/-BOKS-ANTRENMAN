import React from 'react';
import PageHeader from '@/components/PageHeader';

export default function Settings() {
  return (
    <div>
      <PageHeader title="Ayarlar" />
      <p className="text-sm text-muted-foreground leading-relaxed">
        Uygulama ayarları sonraki geliştirme aşamalarında burada yapılandırılacaktır.
      </p>
    </div>
  );
}