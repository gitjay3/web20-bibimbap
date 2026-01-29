# Bookstcamp

<div align="center">

**부스트캠프 내의 예약이 필요한 이벤트들을 한 곳에서 관리하는 서비스**

[데모 보기](#) · [버그 리포트](../../issues) · [기능 제안](../../issues)

</div>

<br>

## 목차

- [Bookstcamp](#bookstcamp)
  - [목차](#목차)
  - [프로젝트 소개](#프로젝트-소개)
  - [팀원](#팀원)
  - [주요 기능](#주요-기능)
    - [캠퍼 기능](#캠퍼-기능)
    - [운영진 기능](#운영진-기능)
  - [기술 스택](#기술-스택)
    - [Frontend](#frontend)
    - [Backend \& Database](#backend--database)
    - [Infrastructure](#infrastructure)
  - [설치 및 실행](#설치-및-실행)
    - [모니터링 (Prometheus + Grafana)](#모니터링-prometheus--grafana)
    - [부하 테스트 (k6)](#부하-테스트-k6)
      - [예약 시스템 테스트](#예약-시스템-테스트)
      - [대기열 테스트](#대기열-테스트)
  - [라이선스](#라이선스)

<br>

## 프로젝트 소개

Bookstcamp는 동시성 제어를 통한 정확한 선착순 처리와 실시간 예약 현황 공개로 공정하고 투명한 예약 시스템을 제공합니다.

- 동시 접속 환경에서도 정확한 선착순 예약 처리 구현
- 예약 현황을 실시간으로 투명하게 공개하여 신뢰성 확보
- 운영진의 이벤트 관리 에너지 단축
- 예약 관련 분쟁 및 문의 감소

<br>

## 팀원

|                                 J049                                  |                                 J116                                  |                                   J248                                   |                                   J283                                    |
| :-------------------------------------------------------------------: | :-------------------------------------------------------------------: | :----------------------------------------------------------------------: | :-----------------------------------------------------------------------: |
| <img src="https://avatars.githubusercontent.com/wfs0502" width="120"> | <img src="https://avatars.githubusercontent.com/gitjay3" width="120"> | <img src="https://avatars.githubusercontent.com/RainWhales" width="120"> | <img src="https://avatars.githubusercontent.com/hanpengbutt" width="120"> |
|                 [김시영](https://github.com/wfs0502)                  |                 [박재성](https://github.com/gitjay3)                  |                 [정희재](https://github.com/RainWhales)                  |                 [한지은](https://github.com/hanpengbutt)                  |

<br>

## 주요 기능

### 캠퍼 기능

**예약 시스템**

- 선착순 예약: 동시성 제어를 통한 공정한 예약 처리
- 실시간 현황: 남은 자리 수와 예약 가능 여부 실시간 확인
- 즉시 피드백: 예약 성공/실패를 즉시 확인

**예약 관리**

- 내 예약 조회: 진행 예정, 완료, 취소된 예약 내역 확인
- 예약 취소: 취소 마감 시간 내 간편한 예약 취소

**이벤트 탐색**

- 전체 이벤트 목록: 모든 예약 가능한 이벤트 한눈에 보기
- 카테고리 필터: 멘토링, 회의실, 특강 등 카테고리별 필터링
- 상태 표시: 예약 가능/마감 상태 명확한 표시

<br>

### 운영진 기능

**이벤트 생성**

- 유연한 설정: 제목, 설명, 날짜/시간 등 기본 정보 입력
- 예약 규칙 설정: 인원 제한, 예약 시작/마감 시간, 취소 마감 시간 설정
- 이벤트 유형: 멘토링, 회의실, 장비, 특강 등 다양한 유형 지원

**예약 관리**

- 통합 대시보드: 전체 예약 현황을 한눈에 파악
- 예약자 관리: 예약자 명단 확인 및 수동 예약 추가/삭제
- 통계 확인: 이벤트별 예약률 및 취소율 분석

<br>

## 기술 스택

### Frontend

![Frontend Skills](https://skillicons.dev/icons?i=react,typescript,vite,tailwind)

### Backend & Database

![Backend Skills](https://skillicons.dev/icons?i=nestjs,prisma,postgresql,redis)

### Infrastructure

![Infrastructure Skills](https://skillicons.dev/icons?i=docker,nginx,githubactions)
![Naver Cloud](https://img.shields.io/badge/Naver%20Cloud-03C75A?style=for-the-badge&logo=naver&logoColor=white)

<br>

## 설치 및 실행

> Node.js 18+, pnpm 8+, Docker 필요

```bash
# 저장소 클론
git clone https://github.com/boostcampwm2025/web20-bibimbap
cd web20-bibimbap

# 의존성 설치
pnpm install

# Docker 컨테이너 실행
pnpm docker:local:up

# Prisma 클라이언트 생성
pnpm db:generate:local

# 시드 데이터 삽입
pnpm db:seed:local
```

- 로컬 확인: http://localhost
- API 문서(Swagger): http://localhost/api-docs

<br>

### 모니터링 (Prometheus + Grafana)

```bash
# 모니터링 포함 실행
pnpm docker:local:up:monitoring

# 종료
pnpm docker:local:down
```

- Grafana: http://localhost:3000 (admin / admin)
- Prometheus: http://localhost:9090

<br>

### 부하 테스트 (k6)

> k6 설치 필요: https://grafana.com/docs/k6/latest/set-up/install-k6/

```bash
# 선착순 경쟁 테스트 (200 VU → 정원 5명)
pnpm k6:competition

# 스트레스 테스트 (5,000 VU → 정원 5명)
pnpm k6:stress

# 스파이크 테스트 (10,000 VU → 정원 5명)
pnpm k6:spike

# 팀 예약 테스트 (200 VU → 정원 10팀)
pnpm k6:team

# 비즈니스 로직 테스트 (중복 방지, 취소 후 재예약)
pnpm k6:logic

# 팀 비즈니스 로직 테스트 (팀 중복 예약 방지)
pnpm k6:logic:team

# 대기열 경쟁 테스트 (200 VU)
pnpm k6:queue

# 대기열 스트레스 테스트 (5,000 VU)
pnpm k6:queue:stress

# 대기열 스파이크 테스트 (10,000 VU)
pnpm k6:queue:spike

# 대기열 로직 시나리오 테스트 (진입/중복/토큰→예약)
pnpm k6:queue:logic

# 테스트 데이터 초기화
pnpm k6:reset
```

#### 예약 시스템 테스트

| 테스트      | 동시 사용자 | 정원 | 검증 목적                                                              |
| ----------- | ----------- | ---- | ---------------------------------------------------------------------- |
| competition | 200명       | 5명  | 선착순 경쟁 상황에서 동시성 제어 정확도 검증. 정확히 5명만 성공해야 함 |
| stress      | 5,000명     | 5명  | 60초간 지속적 고부하에서 시스템 안정성 및 응답 시간(p99) 측정          |
| spike       | 10,000명    | 5명  | 이벤트 오픈 직후 순간 트래픽 폭주 상황 대응 능력 검증                  |
| team        | 200명       | 10팀 | 팀 단위 예약에서 동시성 제어 검증. 같은 팀원 중복 예약 방지            |
| logic       | 3명         | 5명  | 중복 예약 방지, 예약 취소 후 재예약, 개인 이벤트 로직 검증             |
| logic:team  | 3명         | 10팀 | 팀 중복 예약 방지 로직 검증. 팀원A 예약 시 팀원B 예약 거절             |

#### 대기열 테스트

| 테스트       | 동시 사용자      | 검증 목적                                              |
| ------------ | ---------------- | ------------------------------------------------------ |
| queue        | 200명            | 대기열 진입 + 상태 폴링 기본 부하 테스트               |
| queue:stress | 5,000명          | 고부하 상황에서 대기열 처리 안정성 및 토큰 발급률 확인 |
| queue:spike  | 10,000명         | 순간 폭주 상황에서 대기열 진입/상태 조회 안정성 확인   |
| queue:logic  | 1명 (3 시나리오) | 대기열 진입/중복 멱등성/토큰→예약 플로 검증            |

<br>

## 라이선스

![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
