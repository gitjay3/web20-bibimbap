import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import PageMeta from '@/components/PageMeta';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import Pagination from '@/components/Pagination';
import PlusIcon from '@/assets/icons/plus.svg?react';
import DownloadIcon from '@/assets/icons/download.svg?react';
import type { Camper } from '@/types/camper';
import {
  getCampers,
  createCamper,
  getCamperTemplate,
  updateCamper,
  deleteCamper,
  uploadCampers,
} from '@/api/organization';
import CamperListTable from './components/CamperListTable';

const ITEMS_PER_PAGE = 20;

function ManageCamper() {
  const { orgId } = useParams<{ orgId: string }>();
  const [campers, setCampers] = useState<Camper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalPages = Math.ceil(campers.length / ITEMS_PER_PAGE);
  const paginatedCampers = campers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (orgId) {
      setIsLoading(true);

      (async () => {
        setCampers(await getCampers(orgId));
        setIsLoading(false);
      })();
    }
  }, [orgId]);

  const handleAddCamper = async (newCamperData: Omit<Camper, 'id' | 'status'>) => {
    if (!orgId) return;

    const newCamper = await createCamper(orgId, newCamperData);
    setCampers((prev) => {
      const updated = [...prev, newCamper];
      // 마지막 페이지로 이동
      const newTotalPages = Math.ceil(updated.length / ITEMS_PER_PAGE);
      setCurrentPage(newTotalPages);
      return updated;
    });
    toast.success('캠퍼가 성공적으로 추가되었습니다.');
  };

  const handleUpdateCamper = async (id: string, data: Partial<Omit<Camper, 'id' | 'status'>>) => {
    if (!orgId) return;

    const updated = await updateCamper(orgId, id, data);
    setCampers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    toast.success('캠퍼 정보가 수정되었습니다.');
  };

  const handleDeleteCamper = async (id: string) => {
    if (!orgId) return;

    await deleteCamper(orgId, id);
    setCampers((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      // 현재 페이지가 비게 되면 이전 페이지로 이동
      const newTotalPages = Math.ceil(updated.length / ITEMS_PER_PAGE);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
      return updated;
    });
    toast.success('캠퍼가 삭제되었습니다.');
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !orgId) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await uploadCampers(orgId, formData);
      toast.success('캠퍼 정보가 성공적으로 업로드되었습니다.');
      // 목록 새로고침
      const updatedCampers = await getCampers(orgId);
      setCampers(updatedCampers);
      setCurrentPage(1);
    } catch (error) {
      toast.error('파일 업로드 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    if (!orgId) return;

    const blob = await getCamperTemplate(orgId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'camper_template.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageMeta
        title="캠퍼 관리"
        description="조직에 속한 캠퍼 목록을 확인하고 참여 상태를 관리할 수 있습니다."
      />
      <PageHeader
        title="캠퍼 관리"
        description="현재 선택된 과정의 캠퍼 목록을 관리합니다."
        action={
          <>
            <Button type="secondary" variant="outline" onClickHandler={handleDownloadTemplate}>
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">템플릿 다운로드</span>
              <span className="sm:hidden">템플릿</span>
            </Button>
            <Button type="secondary" onClickHandler={handleUploadClick}>
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">캠퍼 정보 업로드</span>
              <span className="sm:hidden">업로드</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".xlsx, .xls"
            />
          </>
        }
      />
      <div className="flex flex-col gap-6">
        <CamperListTable
          campers={paginatedCampers}
          onAdd={handleAddCamper}
          onUpdate={handleUpdateCamper}
          onDelete={handleDeleteCamper}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    </div>
  );
}

export default ManageCamper;
