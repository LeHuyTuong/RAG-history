import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdminLayout,
  PageHeader,
  StatsGrid,
  FilterBar,
  FilterInput,
  FilterSelect,
  DataTable,
  ActionModal,
  TableActions
} from '../../../components/admin';
import { usePeriodColors } from '../../../hooks/usePeriodColors';
import { getDynastyLabel } from '../../../utils/dynastyUtils';

import { personService } from '../../../services';
const CharacterManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, name: '', id: null });
  const [data, setData] = useState({ stats: [], characters: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', dynasty: '' });
  const { periodColors, getPeriodStyle: getDynastyStyle } = usePeriodColors();

  const handleDelete = async () => {
    if (deleteModal.id === null || deleteModal.id === undefined) return;
    const deleteId = deleteModal.id;

    try {
      await personService.delete(deleteId);
    } catch (error) {
      console.error('Error deleting character:', error);
    }

    setData(prev => ({
      ...prev,
      characters: prev.characters.filter(c => String(c.id) !== String(deleteId))
    }));

    setDeleteModal({ open: false, name: '', id: null });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { items: content } = await personService.filter({ page: 0, size: 500 });

        const mappedContent = content.map(c => ({
          ...c,
          title: c.alias || '',
          years: `${c.birthDate ? new Date(c.birthDate).getFullYear() : '?'} - ${c.deathDate ? new Date(c.deathDate).getFullYear() : '?'}`,
          dynasty: c.dynasty || 'Chưa rõ',
          status: c.status || 'published'
        }));

        const charResult = {
          characters: mappedContent,
          stats: [
            { label: "Tổng số", value: mappedContent.length, trend: "+0", isPositive: true },
            { label: "Công khai", value: mappedContent.filter(c => c.status === 'published' || c.status === 'công khai').length, trend: "+0", isPositive: true },
            { label: "Bản nháp", value: mappedContent.filter(c => c.status === 'draft' || c.status === 'bản nháp').length, trend: "-0", isPositive: false }
          ]
        };

        setData(charResult);
      } catch (error) {
        console.error('Error fetching character data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getNormalizedStatus = (status) => {
    if (!status) return 'draft';
    const normalized = status.toLowerCase().trim();
    return normalized === 'published' || normalized === 'công khai' ? 'published' : 'draft';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'draft':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published': return 'Công khai';
      case 'draft': return 'Bản nháp';
      default: return 'Bản nháp';
    }
  }; const columns = [
    {
      key: 'name', header: 'HỌ VÀ TÊN', render: (row) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/10 shadow-sm shrink-0">
            <span className="material-symbols-outlined text-amber-600 text-xl">person</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-on-surface font-bold text-base hover:text-amber-600 transition-colors cursor-pointer line-clamp-1">{row.name}</span>
            <span className="font-body text-[11px] text-on-surface-variant mt-0.5 opacity-80 italic flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">badge</span>
              {row.title}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'years', header: 'NIÊN ĐẠI', align: 'center', render: (row) => (
        <span className="border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-surface-low text-on-surface-variant border-outline-variant">
          {row.years}
        </span>
      )
    },
    {
      key: 'dynasty', header: 'TRIỀU ĐẠI', align: 'center', render: (row) => {
        const dynasties = Array.isArray(row.dynasties) && row.dynasties.length > 0
          ? row.dynasties
          : (row.dynasty ? (Array.isArray(row.dynasty) ? row.dynasty : [row.dynasty]) : []);

        return (
          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[200px] mx-auto">
            {dynasties.map((d, i) => (
              <span key={i} className={`border px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${getDynastyStyle(getDynastyLabel(d))}`}>
                {getDynastyLabel(d)}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      key: 'status', header: 'TRẠNG THÁI', align: 'center', render: (row) => (
        <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${getStatusStyle(getNormalizedStatus(row.status))}`}>
          {getStatusLabel(getNormalizedStatus(row.status))}
        </span>
      )
    },
    {
      key: 'actions', header: 'THAO TÁC', align: 'right', render: (row) => (
        <TableActions
          onEdit={() => navigate(`/admin/characters/edit/${row.id}`)}
          onDelete={() => setDeleteModal({ open: true, name: row.name, id: row.id })}
        />
      )
    }
  ];

  const filteredCharacters = data.characters.filter(char => {
    const matchSearch = char.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      char.title?.toLowerCase().includes(filters.search.toLowerCase());
    const matchDynasty = filters.dynasty ? char.dynasty === filters.dynasty : true;
    const matchStatus = filters.status ? getNormalizedStatus(char.status) === filters.status : true;
    return matchSearch && matchDynasty && matchStatus;
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý Nhân vật Lịch sử"
        subtitle="Quản lý hồ sơ, tiểu sử và các mối liên kết thực thể trong hệ thống Sử Việt."
        actionLabel="THÊM NHÂN VẬT MỚI"
        actionHref="/admin/characters/new"
        actionIcon="person_add"
      />

      <div className="mb-6">
        <StatsGrid
          stats={data.stats.filter(stat => !stat.label.toLowerCase().includes('chờ duyệt'))}
          loading={loading}
        />
      </div>

      <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col mt-6">
        <div className="p-4 border-b border-outline-variant bg-surface-low/50">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm nhân vật (Tên, vai trò)..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-on-surface placeholder:font-medium placeholder:opacity-50"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <select
                  value={filters.dynasty}
                  onChange={(e) => handleFilterChange('dynasty', e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-amber-500 hover:border-amber-500/50 transition-all min-w-[160px]"
                >
                  <option value="">Tất cả triều đại</option>
                  <option value="Nhà Đinh - Tiền Lê">Nhà Đinh - Tiền Lê</option>
                  <option value="Nhà Lý">Nhà Lý</option>
                  <option value="Nhà Trần">Nhà Trần</option>
                  <option value="Nhà Hậu Lê">Nhà Hậu Lê</option>
                  <option value="Nhà Nguyễn">Nhà Nguyễn</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>

              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-amber-500 hover:border-amber-500/50 transition-all min-w-[150px]"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="published">Công khai</option>
                  <option value="draft">Bản nháp</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
              </div>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredCharacters}
          loading={loading}
          emptyMessage="Không tìm thấy nhân vật nào phù hợp"
          onRowClick={(row) => navigate(`/admin/characters/edit/${row.id}`)}
          rowKey="id"
          striped={false}
          rowClassName={(row) => getNormalizedStatus(row.status) === 'published' ? 'bg-emerald-50/80 !font-semibold border-l-4 border-l-emerald-500 shadow-sm relative z-10' : ''}
          className="border-0 shadow-none rounded-none"
        />
      </div>

      <ActionModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, name: '', id: null })}
        type="delete"
        item={{ name: deleteModal.name }}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
};

export default CharacterManagement;