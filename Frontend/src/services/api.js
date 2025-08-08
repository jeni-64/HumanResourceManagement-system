import axios from 'axios';

// ======================= AXIOS INSTANCE =======================
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// ======================= REQUEST INTERCEPTOR =======================
api.interceptors.request.use(
  (config) => {
    // Use accessToken consistently
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Optional: Add unique request ID
    config.headers['X-Request-ID'] = crypto.randomUUID();

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// ======================= RESPONSE INTERCEPTOR WITH RETRY =======================
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

api.interceptors.response.use(
  (response) => response.data || response,
  async (error) => {
    const originalConfig = error.config;

    if (shouldRetry(error)) {
      return retryRequest(originalConfig);
    }

    return handleApiError(error);
  }
);

function shouldRetry(error) {
  return (error.code === 'ECONNABORTED' || !error.response) &&
         (!error.config.retryCount || error.config.retryCount < MAX_RETRIES);
}

async function retryRequest(config) {
  if (!config.retryCount) config.retryCount = 0;
  config.retryCount += 1;

  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  return api(config);
}

function handleApiError(error) {
  const { response } = error;

  if (!response) {
    return Promise.reject(new Error('Network error. Please check your connection.'));
  }

  if (response.status === 401) {
    handleUnauthorized();
  } else if (response.status === 403) {
    console.error('Access forbidden:', response.data?.message);
  }

  return Promise.reject({
    status: response.status,
    message: response.data?.message || error.message,
    errors: response.data?.errors,
    code: response.data?.code
  });
}

function handleUnauthorized() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
}

// ======================= HELPER METHODS =======================
export const get = (url, config = {}) => api.get(url, config);
export const post = (url, data, config = {}) => api.post(url, data, config);
export const put = (url, data, config = {}) => api.put(url, data, config);
export const patch = (url, data, config = {}) => api.patch(url, data, config);
export const del = (url, config = {}) => api.delete(url, config);

// ======================= NAMED API GROUPS =======================

// Auth API
export const authAPI = {
  login: (credentials) => post('/auth/login', credentials),
  register: (userData) => post('/auth/register', userData),
  me: () => get('/auth/me'),
  logout: () => post('/auth/logout')
};

// Employee API
export const employeeAPI = {
  getAll: (params) => get('/employees', { params }),
  getById: (id) => get(`/employees/${id}`),
  create: (data) => post('/employees', data),
  update: (id, data) => put(`/employees/${id}`, data),
  delete: (id) => del(`/employees/${id}`)
};

// Department API
export const departmentAPI = {
  getAll: (params) => get('/departments', { params }),
  getById: (id) => get(`/departments/${id}`),
  create: (data) => post('/departments', data),
  update: (id, data) => put(`/departments/${id}`, data),
  delete: (id) => del(`/departments/${id}`)
};

// Attendance API
export const attendanceAPI = {
  getAll: (params) => get('/attendance', { params }),
  getById: (id) => get(`/attendance/${id}`),
  create: (data) => post('/attendance', data),
  update: (id, data) => put(`/attendance/${id}`, data),
  delete: (id) => del(`/attendance/${id}`)
};

// Leave API
export const leaveAPI = {
  getRequests: (params) => get('/leave', { params }),
  getById: (id) => get(`/leave/${id}`),
  create: (data) => post('/leave', data),
  update: (id, data) => put(`/leave/${id}`, data),
  delete: (id) => del(`/leave/${id}`)
};

// Payroll API
export const payrollAPI = {
  getAll: (params) => get('/payroll', { params }),
  getById: (id) => get(`/payroll/${id}`),
  create: (data) => post('/payroll', data),
  update: (id, data) => put(`/payroll/${id}`, data),
  delete: (id) => del(`/payroll/${id}`)
};

// Reports API
export const reportsAPI = {
  getEmployeeStats: (params) => get('/reports/employees/stats', { params }),
  getAttendanceReport: (params) => get('/reports/attendance', { params }),
  getLeaveReport: (params) => get('/reports/leave', { params }),
  getPayrollReport: (params) => get('/reports/payroll', { params })
};

// User API
export const userAPI = {
  getAll: (params) => get('/users', { params }),
  getById: (id) => get(`/users/${id}`),
  create: (data) => post('/users', data),
  update: (id, data) => put(`/users/${id}`, data),
  delete: (id) => del(`/users/${id}`),
  changePassword: (data) => patch('/users/change-password', data)
};

// ======================= DEFAULT EXPORT =======================
export default api;
