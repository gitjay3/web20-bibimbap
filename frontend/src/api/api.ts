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

      // HTTP 상태 코드별 처리
      switch (status) {
        case 400:
          // TODO: 임시 에러 처리. 나중에 전역에러 필터 등으로 수정요함
          toast.error(errorMessage);
          break;
        default:
          toast.error(errorMessage);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
