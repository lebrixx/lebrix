import React from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onBack: () => void;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Last-resort safety net around the Daily Challenge screen.
 * Guarantees that an unexpected render-time exception never produces
 * an unrecoverable black screen — the user can always go back.
 */
export class DailyChallengeBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('[DailyChallengeBoundary] Render crash caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[hsl(var(--game-dark))] flex flex-col items-center justify-center px-6 text-center relative">
          <Button
            onClick={this.props.onBack}
            variant="ghost"
            size="icon"
            className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--button-hover))]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-14 h-14 rounded-xl bg-[hsl(var(--wheel-base))] border border-[hsl(var(--wheel-border)/0.5)] flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6 text-[hsl(var(--primary))]" />
          </div>
          <p className="text-base font-bold text-[hsl(var(--text-primary))] mb-2">
            Défi indisponible
          </p>
          <p className="text-sm text-[hsl(var(--text-muted))] mb-5">
            Réessaie dans quelques secondes.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={this.handleRetry}
              className="bg-gradient-primary rounded-xl px-6"
            >
              Réessayer
            </Button>
            <Button
              onClick={this.props.onBack}
              variant="outline"
              className="rounded-xl px-6"
            >
              Retour
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
