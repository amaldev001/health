import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState, ErrorState, Modal, Table, Pagination } from '../components/UI';
import { ErrorBoundary } from '../components/ErrorBoundary';

function ProblemComponent() {
  throw new Error('Test crash');
}

describe('UI Empty/Error components & ErrorBoundary', () => {
  it('renders EmptyState with message and action button', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        message="No appointments found."
        actionLabel="Book Now"
        onAction={handleAction}
      />
    );

    expect(screen.getByText('No appointments found.')).toBeInTheDocument();
    const btn = screen.getByText('Book Now');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders ErrorState with message and retry button', () => {
    const handleRetry = vi.fn();
    render(
      <ErrorState message="Server connection failed." onRetry={handleRetry} />
    );

    expect(screen.getByText('Server connection failed.')).toBeInTheDocument();
    const btn = screen.getByText('Retry');
    fireEvent.click(btn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('Modal renders title, content, and calls onClose on escape key', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <p>Modal Body</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Body')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('ErrorBoundary catches child crash and renders fallback UI', () => {
    // Suppress console.error for expected test throw
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary>
        <ProblemComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

    console.error = originalError;
  });
});
