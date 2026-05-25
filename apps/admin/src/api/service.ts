/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from './client';
import * as mock from './mockData';

// State-holders in-memory for fallback updates during runtime
let categories = [...mock.mockCategories];
let challenges = [...mock.mockChallenges];
let users = [...mock.mockUsers];
const userChallenges = [...mock.mockUserChallenges];
const dailyCheckins = [...mock.mockDailyCheckins];
const shareEvents = [...mock.mockShareEvents];

// Standard Helper to wrap API calls with a dynamic mock fallback
async function apiCall<T>(apiFn: () => Promise<T>, fallbackValue: T): Promise<T> {
  try {
    return await apiFn();
  } catch (error) {
    // If endpoints aren't implemented (404) or connection fails (network error), fall back
    console.warn('API call failed, falling back to interactive mock state:', error);
    return Promise.resolve(fallbackValue);
  }
}

// 1. Auth Service
export async function adminLogin(email: string, password: string) {
  try {
    const response = await apiClient.post<{ token: string; user: mock.MockUser }>('/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.warn('Auth API failed, executing fallback matching...', error);
    // Simulate validation
    if (email === 'superadmin@vital30.com' && password === 'Vital30AdminSecured!') {
      return {
        token: 'mock-jwt-token-abcd',
        user: {
          id: 'usr-6',
          email: 'superadmin@vital30.com',
          name: 'Vital30 Super Admin',
          role: 'SUPER_ADMIN' as const,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      };
    }
    throw new Error('Invalid email or password credentials', { cause: error });
  }
}

// 2. Dashboard Service
export async function getDashboardStats() {
  return apiCall(async () => {
    const response = await apiClient.get('/admin/dashboard-stats');
    return response.data;
  }, {
    totalUsers: users.filter((u) => u.role === 'USER').length,
    totalChallenges: challenges.length,
    activeUserChallenges: userChallenges.filter((uc) => uc.status === 'ACTIVE').length,
    totalCheckins: dailyCheckins.length,
    totalShareEvents: shareEvents.length,
    popularChallenges: challenges.filter((c) => c.isPopular).slice(0, 5),
    categoryStats: categories.map((cat) => ({
      name: cat.name,
      challenges: challenges.filter((c) => c.categoryId === cat.id).length,
    })),
    recentActivity: dailyCheckins.slice(0, 5).map((ck) => {
      const uc = userChallenges.find((u) => u.id === ck.userChallengeId);
      const usr = users.find((u) => u.id === uc?.userId);
      const chal = challenges.find((c) => c.id === uc?.challengeId);
      return {
        id: ck.id,
        userName: usr?.name ?? 'Unknown User',
        challengeTitle: chal?.title ?? 'Unknown Challenge',
        status: ck.status,
        date: ck.checkinDate,
      };
    }),
  });
}

// 3. Category Service
export async function getCategories() {
  return apiCall(async () => {
    const response = await apiClient.get<mock.Category[]>('/categories');
    return response.data;
  }, categories);
}

export async function createCategory(data: Omit<mock.Category, 'id' | 'createdAt'>) {
  return apiCall(async () => {
    const response = await apiClient.post<mock.Category>('/categories', data);
    return response.data;
  }, (() => {
    const newCat: mock.Category = {
      id: `cat-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    categories.push(newCat);
    return newCat;
  })());
}

export async function updateCategory(id: string, data: Partial<Omit<mock.Category, 'id' | 'createdAt'>>) {
  return apiCall(async () => {
    const response = await apiClient.patch<mock.Category>(`/categories/${id}`, data);
    return response.data;
  }, (() => {
    categories = categories.map((c) => (c.id === id ? { ...c, ...data } : c));
    return categories.find((c) => c.id === id)!;
  })());
}

export async function toggleCategoryActive(id: string) {
  return apiCall(async () => {
    const response = await apiClient.post<mock.Category>(`/categories/${id}/toggle-active`);
    return response.data;
  }, (() => {
    categories = categories.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    return categories.find((c) => c.id === id)!;
  })());
}

// 4. Challenge Service
export async function getChallenges() {
  return apiCall(async () => {
    const response = await apiClient.get<mock.Challenge[]>('/challenges');
    return response.data;
  }, challenges);
}

export async function createChallenge(data: Omit<mock.Challenge, 'id' | 'createdAt'>) {
  return apiCall(async () => {
    const response = await apiClient.post<mock.Challenge>('/challenges', data);
    return response.data;
  }, (() => {
    const newChal: mock.Challenge = {
      id: `ch-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    challenges.push(newChal);
    return newChal;
  })());
}

export async function updateChallenge(id: string, data: Partial<Omit<mock.Challenge, 'id' | 'createdAt'>>) {
  return apiCall(async () => {
    const response = await apiClient.patch<mock.Challenge>(`/challenges/${id}`, data);
    return response.data;
  }, (() => {
    challenges = challenges.map((c) => (c.id === id ? { ...c, ...data } : c));
    return challenges.find((c) => c.id === id)!;
  })());
}

export async function toggleChallengeActive(id: string) {
  return apiCall(async () => {
    const response = await apiClient.post<mock.Challenge>(`/challenges/${id}/toggle-active`);
    return response.data;
  }, (() => {
    challenges = challenges.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c));
    return challenges.find((c) => c.id === id)!;
  })());
}

export async function toggleChallengePopular(id: string) {
  return apiCall(async () => {
    const response = await apiClient.post<mock.Challenge>(`/challenges/${id}/toggle-popular`);
    return response.data;
  }, (() => {
    challenges = challenges.map((c) => (c.id === id ? { ...c, isPopular: !c.isPopular } : c));
    return challenges.find((c) => c.id === id)!;
  })());
}

export async function toggleChallengeRecommended(id: string) {
  return apiCall(async () => {
    const response = await apiClient.post<mock.Challenge>(`/challenges/${id}/toggle-recommended`);
    return response.data;
  }, (() => {
    challenges = challenges.map((c) => (c.id === id ? { ...c, isRecommended: !c.isRecommended } : c));
    return challenges.find((c) => c.id === id)!;
  })());
}

// 5. User Management Service
export async function getUsers() {
  return apiCall(async () => {
    const response = await apiClient.get<mock.MockUser[]>('/users');
    return response.data;
  }, users);
}

export async function getUserDetails(id: string) {
  return apiCall(async () => {
    const response = await apiClient.get<{ user: mock.MockUser; joinedChallenges: any[] }>(`/users/${id}`);
    return response.data;
  }, (() => {
    const usr = users.find((u) => u.id === id)!;
    const joined = userChallenges
      .filter((uc) => uc.userId === id)
      .map((uc) => {
        const chal = challenges.find((c) => c.id === uc.challengeId)!;
        const checkinsList = dailyCheckins.filter((ck) => ck.userChallengeId === uc.id);
        return {
          ...uc,
          challengeTitle: chal?.title ?? 'Deleted Challenge',
          challengeDifficulty: chal?.difficulty ?? 'MEDIUM',
          checkinsCount: checkinsList.filter((ck) => ck.status === 'COMPLETED').length,
          totalCheckinsExpected: chal?.durationDays ?? 30,
          checkins: checkinsList,
        };
      });
    return { user: usr, joinedChallenges: joined };
  })());
}

export async function toggleUserActive(id: string) {
  return apiCall(async () => {
    const response = await apiClient.post<mock.MockUser>(`/users/${id}/toggle-active`);
    return response.data;
  }, (() => {
    users = users.map((u) => (u.id === id ? { ...u, isActive: !u.isActive } : u));
    return users.find((u) => u.id === id)!;
  })());
}

// 6. Check-ins Service
export async function getCheckins() {
  return apiCall(async () => {
    const response = await apiClient.get('/checkins');
    return response.data;
  }, dailyCheckins.map((ck) => {
    const uc = userChallenges.find((u) => u.id === ck.userChallengeId);
    const usr = users.find((u) => u.id === uc?.userId);
    const chal = challenges.find((c) => c.id === uc?.challengeId);
    return {
      ...ck,
      userName: usr?.name ?? 'Unknown User',
      userEmail: usr?.email ?? 'unknown@user.com',
      challengeTitle: chal?.title ?? 'Unknown Challenge',
    };
  }));
}

// 7. Share Events Service
export async function getShareEvents(): Promise<mock.ShareEventWithDetails[]> {
  return apiCall<mock.ShareEventWithDetails[]>(async () => {
    const response = await apiClient.get<mock.ShareEventWithDetails[]>('/share-events');
    return response.data;
  }, shareEvents.map((se) => {
    const usr = users.find((u) => u.id === se.userId);
    return {
      ...se,
      userName: usr?.name ?? 'Unknown User',
      userEmail: usr?.email ?? 'unknown@user.com',
    };
  }));
}
