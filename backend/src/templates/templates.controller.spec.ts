import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { Template } from '@prisma/client';

describe('TemplatesController', () => {
  let controller: TemplatesController;
  let serviceMock: jest.Mocked<TemplatesService>;

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<TemplatesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [{ provide: TemplatesService, useValue: serviceMock }],
    }).compile();

    controller = module.get<TemplatesController>(TemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('템플릿을 생성한다', async () => {
      const createDto = {
        title: '코드 리뷰 멘토링',
        description: '멘토와 함께하는 코드 리뷰',
        slotSchema: {
          fields: [{ id: 'field-1', name: '시작 시간', type: 'time' }],
        },
      };

      const mockTemplate = {
        id: 1,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      serviceMock.create.mockResolvedValue(mockTemplate);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockTemplate);
      expect(serviceMock.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('모든 템플릿 목록을 반환한다', async () => {
      const mockTemplates: Template[] = [
        {
          id: 1,
          title: 'Template 1',
          description: null,
          slotSchema: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          title: 'Template 2',
          description: null,
          slotSchema: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      serviceMock.findAll.mockResolvedValue(mockTemplates);

      const result = await controller.findAll();

      expect(result).toEqual(mockTemplates);
      expect(serviceMock.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('ID로 템플릿을 조회한다', async () => {
      const mockTemplate: Template = {
        id: 1,
        title: 'Test Template',
        description: null,
        slotSchema: { fields: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      serviceMock.findOne.mockResolvedValue(mockTemplate);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockTemplate);
      expect(serviceMock.findOne).toHaveBeenCalledWith(1);
    });

    it('존재하지 않으면 NotFoundException을 전파한다', async () => {
      serviceMock.findOne.mockRejectedValue(
        new NotFoundException('존재하지 않는 템플릿입니다.'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('템플릿을 수정한다', async () => {
      const updateDto = { title: 'Updated Title' };
      const mockUpdated: Template = {
        id: 1,
        title: 'Updated Title',
        description: null,
        slotSchema: { fields: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      serviceMock.update.mockResolvedValue(mockUpdated);

      const result = await controller.update(1, updateDto);

      expect(result).toEqual(mockUpdated);
      expect(serviceMock.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('remove', () => {
    it('템플릿을 삭제한다', async () => {
      const mockDeleted: Template = {
        id: 1,
        title: 'Deleted Template',
        description: null,
        slotSchema: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      serviceMock.remove.mockResolvedValue(mockDeleted);

      const result = await controller.remove(1);

      expect(result).toEqual(mockDeleted);
      expect(serviceMock.remove).toHaveBeenCalledWith(1);
    });
  });
});
