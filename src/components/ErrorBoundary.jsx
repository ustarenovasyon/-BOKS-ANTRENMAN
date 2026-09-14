import React from 'react';

/**
 * Genel hata sınırı. Runtime component hatasında beyaz ekran yerine
 * Türkçe mesaj + "Tekrar Dene" gösterir. Hata console'da korunur.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-sm text-foreground">
            Uygulama ekranı yüklenirken bir sorun oluştu.
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
          >
            Tekrar Dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}