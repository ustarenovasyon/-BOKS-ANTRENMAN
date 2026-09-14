import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

export default function Home() {
  return (
    <div>
      <PageHeader
        title="Antrenman"
        description="Boks ve kuvvet antrenman programını oluştur, takip et ve kendi hızında ilerle."
      />

      <div className="flex flex-col gap-3">
        <Button asChild>
          <Link to="/program-create">
            <Plus className="w-4 h-4 mr-2" />
            Program Oluştur
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/programs">
            <ClipboardList className="w-4 h-4 mr-2" />
            Programlarım
          </Link>
        </Button>
      </div>

      <div className="mt-8">
        <EmptyState
          title="Henüz oluşturulmuş bir program yok."
          description="Program oluşturduktan sonra burada görünecektir."
        />
      </div>
    </div>
  );
}