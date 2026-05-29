import { isAxiosError } from 'axios';
import { apiClient } from './client';
import * as mock from './mockData';

/* ------------------------------------------------------------------ *
 * Admin API service layer.
 *
 * Every call hits the real backend `/admin/*` endpoints (gated on an
 * ADMIN/SUPER_ADMIN Better Auth session cookie, carried by axios via
 * `withCredentials`). `apiCall` keeps a mock fallback so the app still
 * renders during local dev when the API is unreachable.
 *
 * IMPORTANT: the fallback only kicks in when the endpoint is genuinely
 * missing/unreachable (network error or 404). Legitimate business errors
 * — 400 (e.g. deleting a category that still has challenges), 401/403
 * (auth/role) — are re-thrown so pages can surface the real message
 * instead of silently masking it with mock success.
 * ------------------------------------------------------------------ */

// In-memory mock state so fallback mutations feel interactive.
let categories = [...mock.mockCategories];
let challenges = [...mock.mockChallenges];
let users = [...mock.mockUsers];
let contactSubmissions = [...mock.mockContactSubmissions];
let chatMessages = [...mock.mockChatMessages];

/** True when the failure means "API not available" (fall back to mock). */
function isUnavailableError(error: unknown): boolean {
  if (!isAxiosError(error)) return true; // non-HTTP error → treat as unreachable
  if (!error.response) return true; // network/timeout/CORS → unreachable
  return error.response.status === 404; // endpoint not implemented
}

/** Wrap an API call with a dynamic mock fallback for offline dev. */
async function apiCall<T>(apiFn: () => Promise<T>, fallbackValue: T): Promise<T> {
  try {
    return await apiFn();
  } catch (error) {
    if (isUnavailableError(error)) {
      console.warn('Admin API unavailable, falling back to interactive mock state:', error);
      return Promise.resolve(fallbackValue);
    }
    // Real business/auth error — let the page handle and display it.
    throw error;
  }
}

/* ----------------------------- Dashboard ----------------------------- */

export async function getDashboardStats(): Promise<mock.DashboardStats> {
  return apiCall(
    async () => {
      const { data } = await apiClient.get<mock.DashboardStats>('/admin/dashboard-stats');
      return data;
    },
    {
      totalUsers: users.filter((u) => u.role === 'USER').length,
      suspendedUsers: users.filter((u) => !u.isActive).length,
      catalogChallenges: challenges.filter((c) => !c.isCustom).length,
      customChallenges: mock.mockCustomChallenges.length,
      activeUserChallenges: 4,
      completedUserChallenges: 1,
      totalCheckins: mock.mockCheckins.length,
      contactTotal: contactSubmissions.length,
      contactUnresolved: contactSubmissions.filter((c) => !c.resolvedAt).length,
    },
  );
}

/* ----------------------------- Categories ---------------------------- */

export async function getCategories(): Promise<mock.Category[]> {
  return apiCall(async () => {
    const { data } = await apiClient.get<mock.Category[]>('/admin/categories');
    return data;
  }, categories);
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
}): Promise<mock.Category> {
  return apiCall(
    async () => {
      const res = await apiClient.post<mock.Category>('/admin/categories', data);
      return res.data;
    },
    (() => {
      const newCat: mock.Category = {
        id: `cat-${Date.now()}`,
        name: data.name,
        slug: data.slug,
        description: data.description,
        createdAt: new Date().toISOString(),
        challengeCount: 0,
      };
      categories = [...categories, newCat];
      return newCat;
    })(),
  );
}

export async function updateCategory(
  id: string,
  data: Partial<{ name: string; slug: string; description: string }>,
): Promise<mock.Category> {
  return apiCall(
    async () => {
      const res = await apiClient.patch<mock.Category>(`/admin/categories/${id}`, data);
      return res.data;
    },
    (() => {
      categories = categories.map((c) => (c.id === id ? { ...c, ...data } : c));
      return categories.find((c) => c.id === id)!;
    })(),
  );
}

export async function deleteCategory(id: string): Promise<{ id: string; deleted: true }> {
  return apiCall(
    async () => {
      const res = await apiClient.delete<{ id: string; deleted: true }>(`/admin/categories/${id}`);
      return res.data;
    },
    (() => {
      categories = categories.filter((c) => c.id !== id);
      return { id, deleted: true as const };
    })(),
  );
}

/* ----------------------------- Challenges ---------------------------- */

export async function getChallenges(): Promise<mock.Challenge[]> {
  return apiCall(async () => {
    const { data } = await apiClient.get<mock.Challenge[]>('/admin/challenges');
    return data;
  }, challenges);
}

export async function createChallenge(data: mock.ChallengeInput): Promise<mock.Challenge> {
  return apiCall(
    async () => {
      const res = await apiClient.post<mock.Challenge>('/admin/challenges', data);
      return res.data;
    },
    (() => {
      const category = categories.find((c) => c.id === data.categoryId);
      const newChal: mock.Challenge = {
        id: `ch-${Date.now()}`,
        title: data.title,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        dailyTask: data.dailyTask,
        durationDays: data.durationDays,
        difficulty: data.difficulty,
        benefits: data.benefits,
        safetyNote: data.safetyNote,
        isActive: data.isActive ?? true,
        isPopular: data.isPopular ?? false,
        isRecommended: data.isRecommended ?? false,
        visibility: 'PUBLIC',
        isCustom: false,
        createdAt: new Date().toISOString(),
        categoryId: data.categoryId,
        categoryName: category?.name ?? null,
        joinedCount: 0,
      };
      challenges = [...challenges, newChal];
      return newChal;
    })(),
  );
}

export async function updateChallenge(
  id: string,
  data: Partial<mock.ChallengeInput>,
): Promise<mock.Challenge> {
  return apiCall(
    async () => {
      const res = await apiClient.patch<mock.Challenge>(`/admin/challenges/${id}`, data);
      return res.data;
    },
    (() => {
      challenges = challenges.map((c) =>
        c.id === id
          ? {
              ...c,
              ...data,
              categoryName: data.categoryId
                ? (categories.find((cat) => cat.id === data.categoryId)?.name ?? c.categoryName)
                : c.categoryName,
            }
          : c,
      );
      return challenges.find((c) => c.id === id)!;
    })(),
  );
}

/** Soft-deactivate a challenge. Also used to unpublish custom challenges. */
export async function deleteChallenge(id: string): Promise<{ id: string; isActive: false }> {
  return apiCall(
    async () => {
      const res = await apiClient.delete<{ id: string; isActive: false }>(`/admin/challenges/${id}`);
      return res.data;
    },
    (() => {
      challenges = challenges.map((c) => (c.id === id ? { ...c, isActive: false } : c));
      return { id, isActive: false as const };
    })(),
  );
}

/* ------------------------------- Users ------------------------------- */

export async function getUsers(params?: {
  search?: string;
  skip?: number;
  take?: number;
}): Promise<mock.UsersListResponse> {
  return apiCall(
    async () => {
      const { data } = await apiClient.get<mock.UsersListResponse>('/admin/users', { params });
      return data;
    },
    (() => {
      const term = (params?.search ?? '').toLowerCase();
      const filtered = term
        ? users.filter(
            (u) =>
              u.name.toLowerCase().includes(term) ||
              u.email.toLowerCase().includes(term) ||
              (u.username ?? '').toLowerCase().includes(term),
          )
        : users;
      const skip = params?.skip ?? 0;
      const take = params?.take ?? 50;
      return {
        total: filtered.length,
        skip,
        take,
        users: filtered.slice(skip, skip + take),
      };
    })(),
  );
}

export async function getUserDetails(id: string): Promise<mock.UserDetailResponse> {
  return apiCall(
    async () => {
      const { data } = await apiClient.get<mock.UserDetailResponse>(`/admin/users/${id}`);
      return data;
    },
    (() => {
      const profile = mock.mockUserProfiles[id] ?? mock.mockUserProfiles['usr-1'];
      const joined = mock.mockJoinedChallenges[id] ?? [];
      return {
        user: profile,
        joinedChallenges: joined,
        createdChallenges: mock.mockCustomChallenges
          .filter((cc) => cc.creatorId === id)
          .map((cc) => ({
            id: cc.id,
            title: cc.title,
            visibility: cc.visibility,
            isActive: cc.isActive,
            createdAt: cc.createdAt,
          })),
        friendCount: mock.mockFriendships.filter(
          (f) => f.requesterId === id || f.recipientId === id,
        ).length,
        chatMessageCount: mock.mockChatMessages.filter((m) => m.userId === id).length,
      };
    })(),
  );
}

export async function setUserActive(
  id: string,
  isActive: boolean,
): Promise<{ id: string; isActive: boolean }> {
  return apiCall(
    async () => {
      const res = await apiClient.post<{ id: string; isActive: boolean }>(
        `/admin/users/${id}/active`,
        { isActive },
      );
      return res.data;
    },
    (() => {
      users = users.map((u) => (u.id === id ? { ...u, isActive } : u));
      return { id, isActive };
    })(),
  );
}

export async function setUserRole(
  id: string,
  role: mock.MockUser['role'],
): Promise<{ id: string; role: mock.MockUser['role'] }> {
  return apiCall(
    async () => {
      const res = await apiClient.patch<{ id: string; role: mock.MockUser['role'] }>(
        `/admin/users/${id}/role`,
        { role },
      );
      return res.data;
    },
    (() => {
      users = users.map((u) => (u.id === id ? { ...u, role } : u));
      return { id, role };
    })(),
  );
}

/* ------------------------------ Check-ins ---------------------------- */

export async function getCheckins(params?: {
  skip?: number;
  take?: number;
}): Promise<mock.CheckinsResponse> {
  return apiCall(
    async () => {
      const { data } = await apiClient.get<mock.CheckinsResponse>('/admin/checkins', { params });
      return data;
    },
    {
      total: mock.mockCheckins.length,
      skip: params?.skip ?? 0,
      take: params?.take ?? 50,
      checkins: mock.mockCheckins,
    },
  );
}

/* ---------------------------- Share events --------------------------- */

export async function getShareEvents(params?: {
  skip?: number;
  take?: number;
}): Promise<mock.ShareEventsResponse> {
  return apiCall(
    async () => {
      const { data } = await apiClient.get<mock.ShareEventsResponse>('/admin/share-events', {
        params,
      });
      return data;
    },
    {
      total: mock.mockShareEvents.length,
      skip: params?.skip ?? 0,
      take: params?.take ?? 50,
      events: mock.mockShareEvents,
    },
  );
}

/* ------------------------- Custom challenges ------------------------- */

export async function getCustomChallenges(): Promise<mock.CustomChallengeRow[]> {
  return apiCall(async () => {
    const { data } = await apiClient.get<mock.CustomChallengeRow[]>('/admin/custom-challenges');
    return data;
  }, mock.mockCustomChallenges);
}

/* --------------------------- Chat messages --------------------------- */

export async function getChatMessages(params?: {
  skip?: number;
  take?: number;
}): Promise<mock.ChatMessagesResponse> {
  return apiCall(
    async () => {
      const { data } = await apiClient.get<mock.ChatMessagesResponse>('/admin/chat-messages', {
        params,
      });
      return data;
    },
    {
      total: chatMessages.length,
      skip: params?.skip ?? 0,
      take: params?.take ?? 50,
      messages: chatMessages,
    },
  );
}

export async function deleteChatMessage(id: string): Promise<{ id: string; deleted: true }> {
  return apiCall(
    async () => {
      const res = await apiClient.delete<{ id: string; deleted: true }>(`/admin/chat-messages/${id}`);
      return res.data;
    },
    (() => {
      chatMessages = chatMessages.filter((m) => m.id !== id);
      return { id, deleted: true as const };
    })(),
  );
}

/* ---------------------------- Friendships ---------------------------- */

export async function getFriendships(params?: {
  skip?: number;
  take?: number;
}): Promise<mock.FriendshipsResponse> {
  return apiCall(
    async () => {
      const { data } = await apiClient.get<mock.FriendshipsResponse>('/admin/friendships', {
        params,
      });
      return data;
    },
    {
      total: mock.mockFriendships.length,
      skip: params?.skip ?? 0,
      take: params?.take ?? 50,
      friendships: mock.mockFriendships,
    },
  );
}

/* ----------------------- Contact submissions ------------------------ */

export async function getContactSubmissions(params?: {
  resolved?: boolean;
  skip?: number;
  take?: number;
}): Promise<mock.ContactSubmissionsResponse> {
  return apiCall(
    async () => {
      const { data } = await apiClient.get<mock.ContactSubmissionsResponse>(
        '/admin/contact-submissions',
        { params },
      );
      return data;
    },
    (() => {
      let filtered = contactSubmissions;
      if (params?.resolved === true) filtered = filtered.filter((c) => c.resolvedAt);
      if (params?.resolved === false) filtered = filtered.filter((c) => !c.resolvedAt);
      const skip = params?.skip ?? 0;
      const take = params?.take ?? 50;
      return {
        total: filtered.length,
        skip,
        take,
        submissions: filtered.slice(skip, skip + take),
      };
    })(),
  );
}

export async function resolveContactSubmission(
  id: string,
  resolved: boolean,
): Promise<{ id: string; resolvedAt: string | null }> {
  return apiCall(
    async () => {
      const res = await apiClient.post<{ id: string; resolvedAt: string | null }>(
        `/admin/contact-submissions/${id}/resolve`,
        { resolved },
      );
      return res.data;
    },
    (() => {
      const resolvedAt = resolved ? new Date().toISOString() : null;
      contactSubmissions = contactSubmissions.map((c) =>
        c.id === id ? { ...c, resolvedAt } : c,
      );
      return { id, resolvedAt };
    })(),
  );
}
