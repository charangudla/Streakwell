import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getHealth } from '../api/client';
import { getDashboardStats, getCategories } from '../api/service';
import { DashboardPage } from './DashboardPage';

vi.mock('../api/client', () => ({
  getHealth: vi.fn(),
}));

vi.mock('../api/service', () => ({
  getDashboardStats: vi.fn(),
  getCategories: vi.fn(),
}));

const mockedGetHealth = vi.mocked(getHealth);
const mockedGetDashboardStats = vi.mocked(getDashboardStats);
const mockedGetCategories = vi.mocked(getCategories);

describe('DashboardPage', () => {
  const mockStats = {
    totalUsers: 5,
    suspendedUsers: 1,
    catalogChallenges: 40,
    customChallenges: 2,
    activeUserChallenges: 4,
    completedUserChallenges: 1,
    totalCheckins: 7,
    contactTotal: 3,
    contactUnresolved: 2,
  };

  beforeEach(() => {
    mockedGetHealth.mockReset();
    mockedGetDashboardStats.mockReset();
    mockedGetCategories.mockReset();
    mockedGetCategories.mockResolvedValue([]);
  });

  it('renders the dashboard details and stats', async () => {
    mockedGetHealth.mockResolvedValue({
      status: 'ok',
      service: 'vital30-api',
      timestamp: '2026-05-25T04:00:00.000Z',
    });
    mockedGetDashboardStats.mockResolvedValue(mockStats);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Vital30 Dashboard' }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Catalog Challenges')).toBeInTheDocument();
    expect(screen.getByText('Total Check-ins')).toBeInTheDocument();
    expect(screen.getByText('Suspended Users')).toBeInTheDocument();
  });

  it('renders connected API health status', async () => {
    mockedGetHealth.mockResolvedValue({
      status: 'ok',
      service: 'vital30-api',
      timestamp: '2026-05-25T04:00:00.000Z',
    });
    mockedGetDashboardStats.mockResolvedValue(mockStats);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/API Server:\s*connected/i)).toBeInTheDocument();
    });
  });

  it('renders disconnected API health status', async () => {
    mockedGetHealth.mockRejectedValue(new Error('Network error'));
    mockedGetDashboardStats.mockResolvedValue(mockStats);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/API Server:\s*offline fallback/i)).toBeInTheDocument();
    });
  });
});
