/**
 * HTTP 요청 헬퍼
 */
import http from 'k6/http';
import { config } from '../config.js';

// 기본 헤더
const defaultHeaders = {
  'Content-Type': 'application/json',
};

/**
 * 인증된 GET 요청
 * @param {string} path - API 경로 (/api/events 등)
 * @param {string} token - JWT 토큰 (optional)
 * @param {object} params - 추가 파라미터 (optional)
 */
export function authGet(path, token = null, params = {}) {
  const url = `${config.baseUrl}${path}`;
  const headers = { ...defaultHeaders };

  if (token) {
    headers['Cookie'] = `access_token=${token}`;
  }

  return http.get(url, {
    headers,
    ...params,
  });
}

/**
 * 인증된 POST 요청
 * @param {string} path - API 경로
 * @param {object} body - 요청 바디
 * @param {string} token - JWT 토큰 (optional)
 * @param {object} params - 추가 파라미터 (optional)
 */
export function authPost(path, body = {}, token = null, params = {}) {
  const url = `${config.baseUrl}${path}`;
  const headers = { ...defaultHeaders };

  if (token) {
    headers['Cookie'] = `access_token=${token}`;
  }

  return http.post(url, JSON.stringify(body), {
    headers,
    ...params,
  });
}

/**
 * 인증 없는 GET 요청
 */
export function publicGet(path, params = {}) {
  const url = `${config.baseUrl}${path}`;
  return http.get(url, {
    headers: defaultHeaders,
    ...params,
  });
}

/**
 * 헬스체크
 */
export function healthCheck() {
  return http.get(`${config.baseUrl}/health`);
}
