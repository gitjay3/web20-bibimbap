import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { SlackService } from '../slack/slack.service';
import { EncryptionService } from '../slack/encryption.service';
import { Role, PreRegStatus, Track } from '@prisma/client';

const createPrismaMock = () => ({
  organization: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  camperOrganization: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  camperPreRegistration: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  event: {
    groupBy: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
});

const createSlackServiceMock = () => ({
  validateTokenAndGetWorkspaceId: jest.fn(),
  getUserProfile: jest.fn(),
});

const createEncryptionServiceMock = () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
});

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prismaMock: ReturnType<typeof createPrismaMock>;
  let slackMock: ReturnType<typeof createSlackServiceMock>;
  let encryptionMock: ReturnType<typeof createEncryptionServiceMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    slackMock = createSlackServiceMock();
    encryptionMock = createEncryptionServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SlackService, useValue: slackMock },
        { provide: EncryptionService, useValue: encryptionMock },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('조직을 찾아 반환한다', async () => {
      const mockOrg = {
        id: 'org-123',
        name: 'Test Org',
        slackBotToken: 'token',
      };
      prismaMock.organization.findUnique.mockResolvedValue(mockOrg);

      const result = await service.findOne('org-123');

      expect(result).toEqual({
        id: 'org-123',
        name: 'Test Org',
        isSlackEnabled: true,
        slackBotToken: undefined,
      });
    });

    it('조직이 없으면 NotFoundException을 던진다', async () => {
      prismaMock.organization.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findMyOrganizations', () => {
    it('ADMIN은 모든 조직을 반환한다', async () => {
      const mockOrgs = [
        { id: 'org-1', name: 'Org 1' },
        { id: 'org-2', name: 'Org 2' },
      ];
      prismaMock.organization.findMany.mockResolvedValue(mockOrgs);
      prismaMock.camperPreRegistration.groupBy.mockResolvedValue([]);
      prismaMock.event.groupBy.mockResolvedValue([]);

      const result = await service.findMyOrganizations('admin-123', Role.ADMIN);

      expect(result).toEqual([
        {
          ...mockOrgs[0],
          camperCount: 0,
          eventCount: 0,
          isSlackEnabled: false,
          slackWorkspaceId: undefined,
        },
        {
          ...mockOrgs[1],
          camperCount: 0,
          eventCount: 0,
          isSlackEnabled: false,
          slackWorkspaceId: undefined,
        },
      ]);
      expect(prismaMock.organization.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });

    it('USER는 자신이 속한 조직만 반환한다', async () => {
      const mockOrg = { id: 'org-123', name: 'Test Org' };
      prismaMock.camperOrganization.findMany.mockResolvedValue([
        { organizationId: 'org-123', organization: mockOrg },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ username: 'testuser' });
      prismaMock.camperPreRegistration.findMany.mockResolvedValue([]);
      prismaMock.camperPreRegistration.groupBy.mockResolvedValue([]);
      prismaMock.event.groupBy.mockResolvedValue([]);

      const result = await service.findMyOrganizations('user-123', Role.USER);

      expect(result).toEqual([
        {
          ...mockOrg,
          camperCount: 0,
          eventCount: 0,
          isSlackEnabled: false,
          slackWorkspaceId: undefined,
        },
      ]);
    });

    it('USER는 초대받은 조직도 포함한다', async () => {
      const claimedOrg = { id: 'org-1', name: 'Claimed Org' };
      const invitedOrg = { id: 'org-2', name: 'Invited Org' };

      prismaMock.camperOrganization.findMany.mockResolvedValue([
        { organizationId: 'org-1', organization: claimedOrg },
      ]);
      prismaMock.user.findUnique.mockResolvedValue({ username: 'testuser' });
      prismaMock.camperPreRegistration.findMany.mockResolvedValue([
        {
          organizationId: 'org-2',
          organization: invitedOrg,
          status: PreRegStatus.INVITED,
        },
      ]);
      prismaMock.camperPreRegistration.groupBy.mockResolvedValue([]);
      prismaMock.event.groupBy.mockResolvedValue([]);

      const result = await service.findMyOrganizations('user-123', Role.USER);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        ...claimedOrg,
        camperCount: 0,
        eventCount: 0,
        isSlackEnabled: false,
        slackWorkspaceId: undefined,
      });
      expect(result).toContainEqual({
        ...invitedOrg,
        camperCount: 0,
        eventCount: 0,
        isSlackEnabled: false,
        slackWorkspaceId: undefined,
      });
    });
  });

  describe('findCampers', () => {
    it('조직의 캠퍼 목록을 반환한다 (REVOKED 제외)', async () => {
      const mockCampers = [
        {
          id: 'camper-1',
          camperId: 'K001',
          name: '홍길동',
          username: 'hong',
          track: Track.WEB,
          status: PreRegStatus.INVITED,
          groupNumber: 1,
        },
      ];
      prismaMock.camperPreRegistration.findMany.mockResolvedValue(mockCampers);

      const result = await service.findCampers('org-123');

      expect(result).toEqual(mockCampers);
      expect(prismaMock.camperPreRegistration.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-123',
          status: { not: PreRegStatus.REVOKED },
        },
        select: expect.any(Object),
        orderBy: { camperId: 'asc' },
      });
    });
  });

  describe('createCamper', () => {
    const createDto = {
      camperId: 'K001',
      name: '홍길동',
      username: 'hong',
      track: Track.WEB,
      groupNumber: 1,
    };

    it('새 캠퍼를 생성한다', async () => {
      const mockCamper = {
        id: 'camper-1',
        ...createDto,
        status: PreRegStatus.INVITED,
      };

      prismaMock.camperPreRegistration.findFirst.mockResolvedValue(null);
      prismaMock.camperPreRegistration.upsert.mockResolvedValue(mockCamper);
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await service.createCamper('org-123', createDto);

      expect(result).toEqual(mockCamper);
    });

    it('이미 존재하는 camperId면 ConflictException을 던진다', async () => {
      prismaMock.camperPreRegistration.findFirst.mockResolvedValue({
        camperId: 'K001',
        username: 'other',
      });

      await expect(service.createCamper('org-123', createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('이미 존재하는 username이면 ConflictException을 던진다', async () => {
      prismaMock.camperPreRegistration.findFirst.mockResolvedValue({
        camperId: 'K999',
        username: 'hong',
      });

      await expect(service.createCamper('org-123', createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('이미 가입된 사용자면 조직 연결도 처리한다', async () => {
      const mockCamper = {
        id: 'camper-1',
        ...createDto,
        status: PreRegStatus.INVITED,
      };
      const mockUser = { id: 'user-123', username: 'hong' };
      const claimedCamper = { ...mockCamper, status: PreRegStatus.CLAIMED };

      prismaMock.camperPreRegistration.findFirst.mockResolvedValue(null);
      prismaMock.camperPreRegistration.upsert.mockResolvedValue(mockCamper);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const txMock = {
        user: { update: jest.fn() },
        camperOrganization: { upsert: jest.fn() },
        camperPreRegistration: {
          update: jest.fn().mockResolvedValue(claimedCamper),
        },
      };
      prismaMock.$transaction.mockImplementation(async (cb) => cb(txMock));

      const result = await service.createCamper('org-123', createDto);

      expect(result.status).toBe(PreRegStatus.CLAIMED);
    });
  });

  describe('updateCamper', () => {
    it('캠퍼 정보를 업데이트한다', async () => {
      const existing = {
        id: 'camper-1',
        organizationId: 'org-123',
        camperId: 'K001',
      };
      const updated = { ...existing, name: '김철수' };

      prismaMock.camperPreRegistration.findUnique.mockResolvedValue(existing);
      prismaMock.camperPreRegistration.findFirst.mockResolvedValue(null);
      prismaMock.camperPreRegistration.update.mockResolvedValue(updated);

      const result = await service.updateCamper('org-123', 'camper-1', {
        name: '김철수',
      });

      expect(result.name).toBe('김철수');
    });

    it('캠퍼가 없으면 NotFoundException을 던진다', async () => {
      prismaMock.camperPreRegistration.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCamper('org-123', 'non-existent', { name: '테스트' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('다른 조직의 캠퍼면 NotFoundException을 던진다', async () => {
      prismaMock.camperPreRegistration.findUnique.mockResolvedValue({
        id: 'camper-1',
        organizationId: 'other-org',
      });

      await expect(
        service.updateCamper('org-123', 'camper-1', { name: '테스트' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeCamper', () => {
    it('캠퍼를 REVOKED 상태로 변경한다', async () => {
      const existing = {
        id: 'camper-1',
        organizationId: 'org-123',
        status: PreRegStatus.INVITED,
        claimedUserId: null,
      };
      const updated = { ...existing, status: PreRegStatus.REVOKED };

      prismaMock.camperPreRegistration.findUnique.mockResolvedValue(existing);

      const txMock = {
        camperPreRegistration: { update: jest.fn().mockResolvedValue(updated) },
        camperOrganization: { delete: jest.fn() },
      };
      prismaMock.$transaction.mockImplementation(async (cb) => cb(txMock));

      const result = await service.removeCamper('org-123', 'camper-1');

      expect(result.status).toBe(PreRegStatus.REVOKED);
    });

    it('CLAIMED 상태면 조직 멤버십도 삭제한다', async () => {
      const existing = {
        id: 'camper-1',
        organizationId: 'org-123',
        status: PreRegStatus.CLAIMED,
        claimedUserId: 'user-123',
      };

      prismaMock.camperPreRegistration.findUnique.mockResolvedValue(existing);

      const txMock = {
        camperPreRegistration: {
          update: jest
            .fn()
            .mockResolvedValue({ ...existing, status: PreRegStatus.REVOKED }),
        },
        camperOrganization: { delete: jest.fn() },
      };
      prismaMock.$transaction.mockImplementation(async (cb) => cb(txMock));

      await service.removeCamper('org-123', 'camper-1');

      expect(txMock.camperOrganization.delete).toHaveBeenCalled();
    });

    it('캠퍼가 없으면 NotFoundException을 던진다', async () => {
      prismaMock.camperPreRegistration.findUnique.mockResolvedValue(null);

      await expect(
        service.removeCamper('org-123', 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
