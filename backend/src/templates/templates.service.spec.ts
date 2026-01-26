import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { createPrismaMock } from '../test/mocks/prisma.mock';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('템플릿을 생성하고 반환한다', async () => {
      const createDto = {
        title: '코드 리뷰 멘토링',
        description: '멘토와 함께하는 코드 리뷰 세션',
        slotSchema: {
          fields: [
            { id: 'field-1', name: '시작 시간', type: 'time' },
            { id: 'field-2', name: '멘토명', type: 'text' },
          ],
        },
      };

      const mockCreatedTemplate = {
        id: 1,
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.template.create.mockResolvedValue(mockCreatedTemplate);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedTemplate);
      expect(prismaMock.template.create).toHaveBeenCalledWith({
        data: {
          title: createDto.title,
          description: createDto.description,
          slotSchema: createDto.slotSchema,
        },
      });
    });

    it('description 없이 템플릿을 생성할 수 있다', async () => {
      const createDto = {
        title: '간단한 템플릿',
        slotSchema: {
          fields: [{ id: 'field-1', name: '시간', type: 'time' }],
        },
      };

      const mockCreatedTemplate = {
        id: 1,
        title: createDto.title,
        description: null,
        slotSchema: createDto.slotSchema,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.template.create.mockResolvedValue(mockCreatedTemplate);

      const result = await service.create(createDto);

      expect(result).toEqual(mockCreatedTemplate);
    });
  });

  describe('findAll', () => {
    it('모든 템플릿을 등록순으로 반환한다', async () => {
      const mockTemplates = [
        { id: 1, title: 'Template 1', createdAt: new Date('2024-01-01') },
        { id: 2, title: 'Template 2', createdAt: new Date('2024-01-02') },
      ];

      prismaMock.template.findMany.mockResolvedValue(mockTemplates);

      const result = await service.findAll();

      expect(result).toEqual(mockTemplates);
      expect(prismaMock.template.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'asc' },
      });
    });

    it('템플릿이 없으면 빈 배열을 반환한다', async () => {
      prismaMock.template.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('템플릿이 존재하면 반환한다', async () => {
      const mockTemplate = {
        id: 1,
        title: 'Test Template',
        description: 'Description',
        slotSchema: { fields: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.template.findUnique.mockResolvedValue(mockTemplate);

      const result = await service.findOne(1);

      expect(result).toEqual(mockTemplate);
      expect(prismaMock.template.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('템플릿이 존재하지 않으면 NotFoundException을 던진다', async () => {
      prismaMock.template.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        '존재하지 않는 템플릿입니다.',
      );
    });
  });

  describe('update', () => {
    it('템플릿을 수정하고 반환한다', async () => {
      const existingTemplate = {
        id: 1,
        title: 'Old Title',
        description: 'Old Description',
        slotSchema: { fields: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateDto = {
        title: 'New Title',
        description: 'New Description',
      };

      const updatedTemplate = {
        ...existingTemplate,
        ...updateDto,
        updatedAt: new Date(),
      };

      prismaMock.template.findUnique.mockResolvedValue(existingTemplate);
      prismaMock.template.update.mockResolvedValue(updatedTemplate);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(updatedTemplate);
      expect(prismaMock.template.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          title: updateDto.title,
          description: updateDto.description,
          slotSchema: undefined,
        },
      });
    });

    it('존재하지 않는 템플릿을 수정하려 하면 NotFoundException을 던진다', async () => {
      prismaMock.template.findUnique.mockResolvedValue(null);

      await expect(service.update(999, { title: 'New' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('템플릿을 삭제한다', async () => {
      const existingTemplate = {
        id: 1,
        title: 'To Delete',
        description: null,
        slotSchema: { fields: [] },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.template.findUnique.mockResolvedValue(existingTemplate);
      prismaMock.template.delete.mockResolvedValue(existingTemplate);

      const result = await service.remove(1);

      expect(result).toEqual(existingTemplate);
      expect(prismaMock.template.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('존재하지 않는 템플릿을 삭제하려 하면 NotFoundException을 던진다', async () => {
      prismaMock.template.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
