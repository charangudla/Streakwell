import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from '../routing/AuthProvider';
import { ProtectedRoute } from '../routing/ProtectedRoute';
import { validateChallengeForm, validateCategoryForm } from '../validation/adminForms';

// Mock useAuth for ProtectedRoute tests
vi.mock('../routing/AuthProvider', async (importOriginal) => {
  const original = await importOriginal<typeof import('../routing/AuthProvider')>();
  return {
    ...original,
    useAuth: vi.fn(),
  };
});

const mockedUseAuth = vi.mocked(useAuth);

describe('Form Validations', () => {
  describe('Challenge Form Validation', () => {
    it('returns error when title or description is missing', () => {
      const res = validateChallengeForm({
        title: '',
        description: '',
        durationDays: 30,
      });

      expect(res.isValid).toBe(false);
      expect(res.errors.title).toBe('Challenge title is required');
      expect(res.errors.description).toBe('Challenge description is required');
    });

    it('returns error when durationDays is zero or negative', () => {
      const res = validateChallengeForm({
        title: 'Walk Daily',
        description: 'Take 10,000 steps daily.',
        durationDays: -5,
      });

      expect(res.isValid).toBe(false);
      expect(res.errors.durationDays).toBe('Duration must be at least 1 day');
    });

    it('returns error when durationDays exceeds 90 days', () => {
      const res = validateChallengeForm({
        title: 'Walk Daily',
        description: 'Take 10,000 steps daily.',
        durationDays: 120,
      });

      expect(res.isValid).toBe(false);
      expect(res.errors.durationDays).toBe('Duration must be 90 days or less');
    });

    it('passes validation when inputs are correct', () => {
      const res = validateChallengeForm({
        title: 'Walk Daily',
        description: 'Take 10,000 steps daily.',
        durationDays: 30,
      });

      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });
  });

  describe('Category Form Validation', () => {
    it('returns error when name is missing', () => {
      const res = validateCategoryForm({ name: '' });

      expect(res.isValid).toBe(false);
      expect(res.errors.name).toBe('Category name is required');
    });

    it('returns error when name exceeds 80 characters', () => {
      const res = validateCategoryForm({ name: 'A'.repeat(81) });

      expect(res.isValid).toBe(false);
      expect(res.errors.name).toBe('Category name must be 80 characters or less');
    });

    it('passes validation when name is valid', () => {
      const res = validateCategoryForm({ name: 'Diet & Nutrition' });

      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });
  });
});

describe('ProtectedRoute Behavior', () => {
  it('redirects unauthenticated users to /login', () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/protected" element={<div>Secret Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page Mock</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('renders child components for authenticated users with allowed roles', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'admin@vital30.com', name: 'Admin', role: 'ADMIN' },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/protected" element={<div>Secret Content</div>} />
          </Route>
          <Route path="/login" element={<div>Login Page Mock</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('redirects to /404 if authenticated user does not have allowed role', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'user@vital30.com', name: 'User', role: 'USER' },
      token: 'jwt-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/protected" element={<div>Secret Content</div>} />
          </Route>
          <Route path="/404" element={<div>Unauthorized 404</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Unauthorized 404')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });
});
