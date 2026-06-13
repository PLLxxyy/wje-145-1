const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${url}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || '请求失败');
  }

  return data as T;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  role: 'admin' | 'player';
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  duration: number;
  price: number;
  status: 'available' | 'maintenance';
  description: string;
}

export interface Script {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  min_players: number;
  max_players: number;
  cover_url: string;
  avg_score?: number | null;
  rating_count?: number;
}

export interface Rating {
  id: number;
  user_id: number;
  script_id: number;
  score: number;
  comment: string;
  nickname: string;
  created_at: string;
}

export interface Booking {
  id: number;
  user_id: number;
  room_id: number;
  script_id: number | null;
  date: string;
  time_slot: string;
  status: 'confirmed' | 'cancelled';
  room_name: string;
  script_title: string | null;
  user_nickname?: string;
}

export interface GroupInvitation {
  id: number;
  creator_id: number;
  creator_name: string;
  script_id: number | null;
  script_title: string | null;
  needed_players: number;
  current_players: number;
  date: string;
  time_slot: string;
  description: string;
  status: 'open' | 'full' | 'closed';
}

export interface AdminStats {
  bookings: Booking[];
  date: string;
  total_rooms: number;
  booked_rooms: number;
  usage_rate: string;
  room_usage: { id: number; name: string; is_booked: boolean }[];
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string, nickname: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname }),
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  getRooms: () => request<{ rooms: Room[] }>('/rooms'),
  createRoom: (data: Partial<Room>) =>
    request<{ room: Room }>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id: number, data: Partial<Room>) =>
    request<{ room: Room }>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  getScripts: () => request<{ scripts: Script[] }>('/scripts'),
  getScript: (id: number) =>
    request<{ script: Script; ratings: Rating[]; avg_score: number | null; rating_count: number }>(`/scripts/${id}`),
  createScript: (data: Partial<Script>) =>
    request<{ script: Script }>('/scripts', { method: 'POST', body: JSON.stringify(data) }),
  rateScript: (id: number, score: number, comment: string) =>
    request<{ message: string }>(`/scripts/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ score, comment }),
    }),

  getMyBookings: () => request<{ bookings: Booking[] }>('/bookings'),
  getAdminBookings: (date?: string) =>
    request<AdminStats>(`/bookings/admin${date ? `?date=${date}` : ''}`),
  createBooking: (data: { room_id: number; script_id?: number; date: string; time_slot: string }) =>
    request<{ booking: Booking }>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  cancelBooking: (id: number) =>
    request<{ message: string }>(`/bookings/${id}/cancel`, { method: 'PUT' }),

  getGroups: () => request<{ groups: GroupInvitation[] }>('/groups'),
  getMyGroups: () => request<{ groups: GroupInvitation[] }>('/groups/my'),
  createGroup: (data: { script_id?: number; needed_players: number; date: string; time_slot: string; description?: string }) =>
    request<{ group: GroupInvitation }>('/groups', { method: 'POST', body: JSON.stringify(data) }),
  joinGroup: (id: number) =>
    request<{ message: string }>(`/groups/${id}/join`, { method: 'POST' }),
};
