import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ToastProvider, useToast } from '../context/ToastContext';

function TestConfirmConsumer() {
  const { showConfirm, addToast } = useToast();

  const handleAction = async () => {
    const confirmed = await showConfirm({
      title: 'Cancel Appointment',
      message: 'Are you sure you want to cancel?',
      confirmText: 'Yes, Cancel',
      cancelText: 'Keep Appointment',
      isDanger: true
    });
    if (confirmed) {
      addToast('Appointment cancelled successfully', 'success');
    } else {
      addToast('Cancellation dismissed', 'info');
    }
  };

  return (
    <button onClick={handleAction}>
      Open Confirm
    </button>
  );
}

describe('ToastProvider & ConfirmDialog', () => {
  it('displays confirm dialog when showConfirm is called and handles confirm', async () => {
    render(
      <ToastProvider>
        <TestConfirmConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Open Confirm'));

    expect(screen.getByText('Cancel Appointment')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to cancel?')).toBeInTheDocument();
    expect(screen.getByText('Yes, Cancel')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Yes, Cancel'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Cancel Appointment')).not.toBeInTheDocument();
      expect(screen.getByText('Appointment cancelled successfully')).toBeInTheDocument();
    });
  });

  it('handles cancel option in ConfirmDialog', async () => {
    render(
      <ToastProvider>
        <TestConfirmConsumer />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Open Confirm'));
    expect(screen.getByText('Keep Appointment')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByText('Keep Appointment'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Cancel Appointment')).not.toBeInTheDocument();
      expect(screen.getByText('Cancellation dismissed')).toBeInTheDocument();
    });
  });
});
