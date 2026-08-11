"use client";

import { Component, type ReactNode } from "react";

interface PreviewErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface PreviewErrorBoundaryState {
  hasError: boolean;
}

/**
 * The compiled MDX preview node comes back from a Server Action as a real
 * React element tree (every component in it is a plain function, not a
 * "use client" component — see mdx-preview.tsx for why). If rendering one
 * throws anyway, this keeps the failure contained to the preview pane
 * instead of taking down the whole editor — the textarea + save flow don't
 * depend on the preview rendering successfully.
 */
export class PreviewErrorBoundary extends Component<PreviewErrorBoundaryProps, PreviewErrorBoundaryState> {
  state: PreviewErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PreviewErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[ContentEditor] preview render failed:", error);
  }

  componentDidUpdate(prevProps: PreviewErrorBoundaryProps) {
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
