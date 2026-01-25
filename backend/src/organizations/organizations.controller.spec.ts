import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { Role, PreRegStatus, Track } from '@prisma/client';

const createOrganizationsServiceMock = () => ({
  findOne: jest.fn(),
  findMyOrganizations: jest.fn(),
  findCampers: jest.fn(),
  createCamper: jest.fn(),
  updateCamper: jest.fn(),
  removeCamper: jest.fn(),
  getCamperTemplate: jest.fn(),
  uploadCampers: jest.fn(),
});

describe('OrganizationsController', () => {
  let controller: OrganizationsController;
  let serviceMock: ReturnType<typeof createOrganizationsServiceMock>;

  beforeEach(async () => {
    serviceMock = createOrganizationsServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [
        { provide: OrganizationsService, useValue: serviceMock },
      ],
    }).compile();

    controller = module.get<OrganizationsController>(OrganizationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findMyOrganizations', () => {
    it('사용자의 조직 목록을 반환한다', async () => {
      const mockOrgs = [{ id: 'org-123', name: 'Test Org' }];
      serviceMock.findMyOrganizations.mockResolvedValue(mockOrgs);

      const result = await controller.findMyOrganizations('user-123', Role.USER);

      expect(result).toEqual(mockOrgs);
      expect(serviceMock.findMyOrganizations).toHaveBeenCalledWith(
        'user-123',
        Role.USER,
      );
    });
  });

  describe('findOne', () => {
    it('조직 정보를 반환한다', async () => {
      const mockOrg = { id: 'org-123', name: 'Test Org' };
      serviceMock.findOne.mockResolvedValue(mockOrg);

      const result = await controller.findOne('org-123');

      expect(result).toEqual(mockOrg);
    });
  });

  describe('findCampers', () => {
    it('조직의 캠퍼 목록을 반환한다', async () => {
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
      serviceMock.findCampers.mockResolvedValue(mockCampers);

      const result = await controller.findCampers('org-123');

      expect(result).toEqual(mockCampers);
    });
  });

  describe('createCamper', () => {
    it('새 캠퍼를 생성한다', async () => {
      const createDto = {
        camperId: 'K001',
        name: '홍길동',
        username: 'hong',
        track: Track.WEB,
        groupNumber: 1,
      };
      const mockCamper = {
        id: 'camper-1',
        ...createDto,
        status: PreRegStatus.INVITED,
      };
      serviceMock.createCamper.mockResolvedValue(mockCamper);

      const result = await controller.createCamper('org-123', createDto);

      expect(result).toEqual(mockCamper);
      expect(serviceMock.createCamper).toHaveBeenCalledWith('org-123', createDto);
    });
  });

  describe('updateCamper', () => {
    it('캠퍼 정보를 업데이트한다', async () => {
      const updateDto = { name: '김철수' };
      const mockCamper = {
        id: 'camper-1',
        camperId: 'K001',
        name: '김철수',
        username: 'hong',
        track: Track.WEB,
        status: PreRegStatus.INVITED,
        groupNumber: 1,
      };
      serviceMock.updateCamper.mockResolvedValue(mockCamper);

      const result = await controller.updateCamper('org-123', 'camper-1', updateDto);

      expect(result).toEqual(mockCamper);
      expect(serviceMock.updateCamper).toHaveBeenCalledWith(
        'org-123',
        'camper-1',
        updateDto,
      );
    });
  });

  describe('deleteCamper', () => {
    it('캠퍼를 삭제한다', async () => {
      const mockResult = {
        id: 'camper-1',
        status: PreRegStatus.REVOKED,
      };
      serviceMock.removeCamper.mockResolvedValue(mockResult);

      const result = await controller.deleteCamper('org-123', 'camper-1');

      expect(result).toEqual(mockResult);
      expect(serviceMock.removeCamper).toHaveBeenCalledWith('org-123', 'camper-1');
    });
  });

  describe('getCamperTemplate', () => {
    it('엑셀 템플릿을 다운로드한다', async () => {
      const mockBuffer = Buffer.from('test');
      serviceMock.getCamperTemplate.mockResolvedValue(mockBuffer);

      const resMock = {
        setHeader: jest.fn(),
        send: jest.fn(),
      };

      await controller.getCamperTemplate(resMock as any);

      expect(resMock.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(resMock.send).toHaveBeenCalledWith(mockBuffer);
    });
  });

  describe('uploadCampers', () => {
    it('캠퍼 일괄 업로드를 처리한다', async () => {
      const mockFile = { buffer: Buffer.from('test') };
      const mockResults = [{ id: 'camper-1' }, { id: 'camper-2' }];
      serviceMock.uploadCampers.mockResolvedValue(mockResults);

      const result = await controller.uploadCampers('org-123', mockFile as any);

      expect(result).toEqual(mockResults);
      expect(serviceMock.uploadCampers).toHaveBeenCalledWith(
        'org-123',
        mockFile.buffer,
      );
    });
  });
});
