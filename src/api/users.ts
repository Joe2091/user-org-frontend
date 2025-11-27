import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001/api',
});

export interface User {
  id?: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  managerId?: number | null;
}

export const getUsers = () => api.get<User[]>('/users');
export const getUser = (id: number) => api.get<User>(`/users/${id}`);
export const createUser = (user: User) => api.post<User>('/users', user);
export const updateUser = (user: User) => api.put<void>(`/users/${user.id}`, user);
export const deleteUser = (id: number) => api.delete<void>(`/users/${id}`);
export const getOrgTree = () => api.get('/users/org-tree');
