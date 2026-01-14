import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) =>
    // TODO: access token 추가 로직 구현
    config,
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) =>
    // TODO: 공통 에러 처리 로직 구현 및 access token 만료 시 재발급 로직 구현

    Promise.reject(error),
);

export default api;
