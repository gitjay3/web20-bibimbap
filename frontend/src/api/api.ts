import axios from 'axios';
import { toast } from 'sonner';

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
  async (error) => {
    // TODO: 공통 에러 처리 로직 구현 및 access token 만료 시 재발급 로직 구현
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.message || '알 수 없는 오류가 발생했습니다.';

      // 401: 인증 만료 시 로그인 페이지로 이동 (이미 로그인 페이지면 리다이렉트 안함)
      if (status === 401 && !window.location.pathname.startsWith('/login')) {
        // TODO: 토큰 재발급
        window.location.href = '/login';
        return Promise.reject(error);
      }

      toast.error(errorMessage);
    } else if (error.code === 'ECONNABORTED') {
      // 타임아웃 에러
      toast.error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
    } else if (error.request) {
      // 네트워크 에러 (요청은 보냈지만 응답 없음)
      toast.error('네트워크 연결을 확인해주세요.');
    } else {
      // 요청 설정 중 에러
      toast.error('요청 중 오류가 발생했습니다.');
    }

    return Promise.reject(error);
  },
);

export default api;
