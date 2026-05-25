import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getHealth } from '../api/client';
import { getDashboardStats } from '../api/service';
import { DashboardPage } from './DashboardPage';

vi.mock('../api/client', () => ({
  getHealth: vi.fn(),
}));

vi.mock('../api/service', () => ({
  getDashboardStats: vi.fn(),
}));

const mockedGetHealth = vi.mocked(getHealth);
const mockedGetDashboardStats = vi.mocked(getDashboardStats);

describe('DashboardPage', () => {
  const mockStats = {
    totalUsers: 5,
    totalChallenges: 40,
    activeUserChallenges: 4,
    totalCheckins: 7,
    totalShareEvents: 4,
    popularChallenges: [],
    categoryStats: [],
    recentActivity: [],
  };

  beforeEach(() => {
    mockedGetHealth.mockReset();
    mockedGetDashboardStats.mockReset();
  });

  it('renders the dashboard details and stats', async () => {
    mockedGetHealth.mockResolvedValue({
      status: 'ok',
      service: 'vital30-api',
      timestamp: '2026-05-25T04:00:00.000Z',
    });
    mockedGetDashboardStats.mockResolvedValue(mockStats);

    render(<DashboardPage />);

    // Verify loading overlay disappears and stats cards are visible
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Vital30 Dashboard' }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('Starter Challenges')).toBeInTheDocument();
    expect(screen.getByText('Completed Check-ins')).toBeInTheDocument();
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
