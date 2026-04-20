import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="max-w-md text-center space-y-4">
            <p className="text-2xl font-semibold text-text-primary">Algo deu errado</p>
            <p className="text-text-muted text-sm font-mono">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-lg bg-purple-primary px-4 py-2 text-sm text-white hover:bg-purple-hover"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
