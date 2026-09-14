import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

/**
 * Bilinmeyen route için çevrimdışı, Türkçe ekran.
 * Uzak API/auth çağrısı yapmaz; teknik hata göstermez.
 */
export default function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-muted-foreground/50">404</h1>
          <div className="h-0.5 w-16 bg-border mx-auto"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-heading tracking-tight text-foreground">
            Sayfa Bulunamadı
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Aradığın sayfa uygulamada bulunamadı.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md"
          >
            <Home className="w-4 h-4 mr-2" />
            Ana Sayfa'ya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}