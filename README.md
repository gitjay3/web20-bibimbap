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
 
## 라이선스
![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)
