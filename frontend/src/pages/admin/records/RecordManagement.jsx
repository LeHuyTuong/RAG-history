import { useState, useEffect } from 'react';
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

  const handleDelete = () => {
    if (deleteModal.id === null || deleteModal.id === undefined) return;
    const deleteId = deleteModal.id;

    let newRecords = JSON.parse(localStorage.getItem('admin_new_records') || '[]');
    newRecords = newRecords.filter(item => String(item.id) !== String(deleteId));
    localStorage.setItem('admin_new_records', JSON.stringify(newRecords));

    const deletedIds = JSON.parse(localStorage.getItem('admin_deleted_ids') || '[]');
    if (!deletedIds.includes(String(deleteId))) {
      deletedIds.push(String(deleteId));
      localStorage.setItem('admin_deleted_ids', JSON.stringify(deletedIds));
    }

    setData(prev => ({
      ...prev,
      records: prev.records.filter(r => String(r.id) !== String(deleteId))
    }));

    setDeleteModal({ open: false, itemName: '', id: null });
  };

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

        // Merge new records from localStorage
        const newRecordsStr = localStorage.getItem('admin_new_records');
        if (newRecordsStr) {
          try {
            const newRecordsRaw = JSON.parse(newRecordsStr);
            const newRecords = newRecordsRaw.map(r => ({
              id: r.id,
              name: r.title,
              author: r.author,
              type: r.sourceType,
              dynasty: "Chưa cập nhật",
              status: "pending",
              progress: 0,
              lastUpdate: new Date().toISOString().split('T')[0]
            }));

            const newRecordIds = new Set(newRecords.map(r => String(r.id)));
            const deletedIds = new Set(JSON.parse(localStorage.getItem('admin_deleted_ids') || '[]'));
            result.records = [
              ...newRecords,
              ...result.records.filter(r => !newRecordIds.has(String(r.id)) && !deletedIds.has(String(r.id)))
            ];
          } catch (e) { console.error('Error parsing new records', e); }
        } else {
          const deletedIds = new Set(JSON.parse(localStorage.getItem('admin_deleted_ids') || '[]'));
          result.records = result.records.filter(r => !deletedIds.has(String(r.id)));
        }

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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Nhập tên sử liệu, tác giả..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/20 transition-all text-on-surface placeholder:font-medium placeholder:opacity-50"
                />
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-amber-700 hover:border-amber-700/50 transition-all min-w-[160px]"
                  >
                    <option value="">Tất cả loại hình</option>
                    {Array.from(new Set(data.records.map(r => r.type))).filter(Boolean).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>

                <div className="relative">
                  <select
                    value={filters.dynasty}
                    onChange={(e) => handleFilterChange('dynasty', e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-amber-700 hover:border-amber-700/50 transition-all min-w-[160px]"
                  >
                    <option value="">Tất cả triều đại</option>
                    {Array.from(new Set(data.records.map(r => r.dynasty))).filter(Boolean).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredRecords}
              loading={loading}
              emptyMessage="Không tìm thấy sử liệu nào phù hợp"
              onRowClick={(row) => navigate(`/admin/records/edit/${row.id}`)}
              rowKey="id"
              striped={false}
              className="border-0 shadow-none rounded-none"
            />
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        type="delete"
        item={{ name: deleteModal.itemName }}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
};

export default RecordManagement;