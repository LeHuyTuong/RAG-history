import {  useState, useEffect  } from 'react';
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

const CharacterManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, name: '', id: null });
  const [data, setData] = useState({ stats: [], characters: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', dynasty: '' });
  const { periodColors, getPeriodStyle: getDynastyStyle } = usePeriodColors();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const charRes = await fetch('/api/admin_characters.json');
        if (!charRes.ok) throw new Error('Characters fetch failed');
        const charResult = await charRes.json();
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



  const columns = [
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
      key: 'dynasty', header: 'TRIỀU ĐẠI', align: 'center', render: (row) => (
        <span className={`border px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${getDynastyStyle(row.dynasty)}`}>
          {row.dynasty}
        </span>
      )
    },
    { 
      key: 'actions', header: 'THAO TÁC', align: 'right', render: (row) => (
        <TableActions
          onEdit={() => navigate(`/admin/characters/edit/${row.id}`)}
          onDelete={() => setDeleteModal({ open: true, name: row.name })}
        />
      )
    }
  ];

  const filteredCharacters = data.characters.filter(char => {
    const matchSearch = char.name?.toLowerCase().includes(filters.search.toLowerCase()) || 
                        char.title?.toLowerCase().includes(filters.search.toLowerCase());
    const matchDynasty = filters.dynasty ? char.dynasty === filters.dynasty : true;
    return matchSearch && matchDynasty;
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
          <FilterBar>
            <FilterInput
              label="Tìm kiếm:"
              placeholder="Nhập tên, chức danh..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <FilterSelect
              label="Triều đại:"
              options={[
                { value: '', label: 'Tất cả triều đại' },
                ...Array.from(new Set(data.characters.map(c => c.dynasty))).filter(Boolean).map(d => ({ value: d, label: d }))
              ]}
              value={filters.dynasty}
              onChange={(e) => handleFilterChange('dynasty', e.target.value)}
            />
          </FilterBar>
        </div>

        <DataTable
          columns={columns}
          data={filteredCharacters}
          loading={loading}
          emptyMessage="Không tìm thấy nhân vật nào phù hợp"
          rowKey="id"
          striped={false}
          className="border-0 shadow-none rounded-none"
        />
      </div>

      <ActionModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        type="delete"
        item={{ name: deleteModal.name }}
        onConfirm={() => setDeleteModal({ open: false })}
      />
    </AdminLayout>
  );
};

export default CharacterManagement;