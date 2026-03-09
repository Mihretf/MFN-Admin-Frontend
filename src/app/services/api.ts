import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  acceptInvite: (token: string, email: string, password: string) =>
    api.post('/auth/accept-invite', { token, email, password }),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};

// Invite API
export const inviteAPI = {
  validateToken: (token: string) =>
    api.get(`/invite/validate?token=${token}`),
  
  sendInvitation: (email: string, role: string, region_id: string) =>
    api.post('/invite/send', { email, role, region_id }),
};

// Region API
export const regionAPI = {
  createRegion: (name: string) =>
    api.post('/api/regions', { name }),
  
  getRegions: () =>
    api.get('/api/regions'),
};

// Church API
export const churchAPI = {
  createChurch: (data: { name: string; region_id: string; location_link?: string }) =>
    api.post('/api/churches', data),
  
  getChurches: (region_id?: string) =>
    api.get(`/api/churches${region_id ? `?region_id=${region_id}` : ''}`),
};

// Upload API (Cloudinary)
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  uploadVideo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload/video', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Blog API (Homepage - Super only)
export const blogAPI = {
  createBlog: (data: {
    text: string;
    image_url?: string;
    expires_in_days?: number;
  }) => api.post('/api/blogs', data),
  
  getBlogs: (params?: {
    search?: string;
    sort?: 'newest' | 'oldest';
    include_expired?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.sort) query.append('sort', params.sort);
    if (params?.include_expired !== undefined) query.append('include_expired', String(params.include_expired));
    return api.get(`/api/blogs?${query.toString()}`);
  },
};

// Post API (Regional Services - Super + Regional Admin)
export const postAPI = {
  createPost: (data: {
    region_id: string;
    content: string;
    category: 'special_program' | 'mission' | 'program_sunday';
    title?: string;
    type?: string;
    image_url?: string;
    video_url?: string;
    location_link?: string;
    church_ids?: string[];
    expires_in_days?: number;
  }) => api.post('/api/posts', data),
  
  getPosts: (params: {
    region_id: string;
    search?: string;
    category?: 'special_program' | 'mission' | 'program_sunday';
    sort?: 'newest' | 'oldest';
    include_expired?: boolean;
  }) => {
    const query = new URLSearchParams();
    query.append('region_id', params.region_id);
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.sort) query.append('sort', params.sort);
    if (params.include_expired !== undefined) query.append('include_expired', String(params.include_expired));
    return api.get(`/api/posts?${query.toString()}`);
  },
};

// Gallery API (Regional Gallery - Super + Regional Admin)
export const galleryAPI = {
  createGalleryItem: (data: {
    region_id: string;
    image_url: string;
    caption?: string;
    church_id?: string;
    location_link?: string;
    expires_in_days?: number;
  }) => api.post('/api/galleries', data),
  
  getGalleryItems: (params: {
    region_id: string;
    search?: string;
    sort?: 'newest' | 'oldest';
    include_expired?: boolean;
  }) => {
    const query = new URLSearchParams();
    query.append('region_id', params.region_id);
    if (params.search) query.append('search', params.search);
    if (params.sort) query.append('sort', params.sort);
    if (params.include_expired !== undefined) query.append('include_expired', String(params.include_expired));
    return api.get(`/api/galleries?${query.toString()}`);
  },
};

export default api;
