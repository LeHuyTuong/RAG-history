import {  useState, useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PageHeader, 
  AdminLayout, 
  StatsGrid, 
  FilterBar,
  FilterInput,
  FilterSelect,
  DataTable, 
  ActionModal, 
  TableActions 
} from '../../../components/admin';
import { usePeriodColors } from '../../../hooks/usePeriodColors';

const RecordManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, itemName: '', id: null });
  const [data, setData] = useState({ stats: { total: { value: '...', sub: '...' }, pending: { value: '...', sub: '...' } }, records: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', type: '', dynasty: '' });
  const { periodColors, getPeriodStyle: getDynastyStyle } = usePeriodColors();

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredRecords = data.records.filter(record => {
    const matchSearch = record.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      record.author?.toLowerCase().includes(filters.search.toLowerCase());
    const matchType = filters.type ? record.type === filters.type : true;
    const matchDynasty = filters.dynasty ? record.dynasty === filters.dynasty : true;
    return matchSearch && matchType && matchDynasty;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin_records.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching records data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    {
      key: 'id', header: 'ID', render: (row) => (
        <span className="font-body text-xs text-primary font-bold">{row.id}</span>
      )
    },
    {
      key: 'name', header: 'Tên Sử Liệu', render: (row) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm shrink-0">
            <span className="material-symbols-outlined text-primary text-lg">{row.icon || 'history_edu'}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-on-surface font-bold text-base hover:text-primary transition-colors cursor-pointer line-clamp-1">{row.name}</span>
            <span className="font-body text-[11px] text-on-surface-variant mt-0.5 opacity-80 italic">
              Chủ biên: {row.author}
            </span>
          </div>
        </div>
      )
    },
    { 
      key: 'type', header: 'Loại hình', render: (row) => (
        <span className="px-3 py-1 bg-primary/5 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
          {row.type}
        </span>
      )
    },
    { 
      key: 'dynasty', header: 'Triều đại', render: (row) => (
        <span className={`border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getDynastyStyle(row.dynasty)}`}>
          {row.dynasty}
        </span>
      )
    },
    {
      key: 'actions', header: 'Thao tác', align: 'right', render: (row) => (
        <TableActions
          onEdit={() => navigate(`/admin/records/edit/${row.id}`)}
          onDelete={() => setDeleteModal({ open: true, itemName: row.name, id: row.id })}
        />
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeader
          title="Quản lý Sử liệu"
          subtitle="Quản lý các bộ chính sử, văn bản cổ và tài liệu nghiên cứu gốc của dân tộc."
          actionLabel="THÊM SỬ LIỆU"
          actionHref="/admin/records/new"
          actionIcon="add"
        />

        {/* BENTO STATS */}
        <div className="mb-6">
          <StatsGrid 
            stats={[
              { label: 'Tổng số sử liệu', value: data.stats.total.value, sub: data.stats.total.sub, icon: 'history_edu' },
              { label: 'Đang chờ duyệt', value: data.stats.pending.value, sub: data.stats.pending.sub, icon: 'pending_actions' }
            ]} 
            loading={loading} 
          />
        </div>

        {/* FILTER & DATA TABLE */}
        <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface-low/50">
            <FilterBar>
              <FilterInput
                label="Tìm kiếm:"
                placeholder="Nhập tên sử liệu, tác giả..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <FilterSelect
                label="Loại hình:"
                options={[
                  { value: '', label: 'Tất cả loại hình' },
                  ...Array.from(new Set(data.records.map(r => r.type))).filter(Boolean).map(t => ({ value: t, label: t }))
                ]}
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              />
              <FilterSelect
                label="Triều đại:"
                options={[
                  { value: '', label: 'Tất cả triều đại' },
                  ...Array.from(new Set(data.records.map(r => r.dynasty))).filter(Boolean).map(d => ({ value: d, label: d }))
                ]}
                value={filters.dynasty}
                onChange={(e) => handleFilterChange('dynasty', e.target.value)}
              />
            </FilterBar>
          </div>

          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredRecords}
              loading={loading}
              emptyMessage="Không tìm thấy sử liệu nào phù hợp"
              rowKey="id"
              striped={false}
              className="border-0 shadow-none rounded-none"
            />
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, itemName: '', id: null })}
        type="delete"
        item={{ name: deleteModal.itemName }}
        onConfirm={() => { alert('Đã xóa'); setDeleteModal({ open: false, itemName: '', id: null }); }}
        description={`Bạn có chắc chắn muốn xóa bản ghi <br/><strong className="text-primary italic">"${deleteModal.itemName}"</strong>? <br/>Hệ thống RAG sẽ bị ảnh hưởng bởi việc này.`}
      />
    </AdminLayout>
  );
};

export default RecordManagement;