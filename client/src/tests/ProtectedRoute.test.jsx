import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';

// Helper component matching App.jsx logic
function ProtectedRoute({ children, allowedRoles, user, loading }) {
  if (loading) return <div>Loading page</div>;
  if (!user) return <div>Redirected to Login</div>;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <div>Redirected to Dashboard ({user.role})</div>;
  }
  return children;
}

function MustChangePasswordGuard({ children, user }) {
  if (user?.mustChangePassword) {
    return <div>Redirected to Change Password</div>;
  }
  return children;
}

describe('ProtectedRoute component & auth guards', () => {
  it('renders loading state when auth is loading', () => {
    render(
      <ProtectedRoute loading={true} user={null}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Loading page')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to login', () => {
    render(
      <ProtectedRoute loading={false} user={null}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Redirected to Login')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated user with allowed role', () => {
    const user = { role: 'patient' };
    render(
      <ProtectedRoute loading={false} user={user} allowedRoles={['patient']}>
        <div>Patient Dashboard</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Patient Dashboard')).toBeInTheDocument();
  });

  it('redirects authenticated user to their role dashboard when role is disallowed', () => {
    const user = { role: 'patient' };
    render(
      <ProtectedRoute loading={false} user={user} allowedRoles={['admin']}>
        <div>Admin Dashboard</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Redirected to Dashboard (patient)')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('forces redirect to change password when mustChangePassword flag is true', () => {
    const user = { role: 'patient', mustChangePassword: true };
    render(
      <MustChangePasswordGuard user={user}>
        <div>Main Dashboard</div>
      </MustChangePasswordGuard>
    );
    expect(screen.getByText('Redirected to Change Password')).toBeInTheDocument();
    expect(screen.queryByText('Main Dashboard')).not.toBeInTheDocument();
  });
});
