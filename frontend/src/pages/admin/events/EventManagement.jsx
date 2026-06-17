import {  useState, useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdminLayout,
  PageHeader,
  FilterBar,
  FilterSelect,
  FilterInput,
  DataTable,
  ActionModal,
  StatsGrid,
  TableActions
} from '../../../components/admin';
import { usePeriodColors } from '../../../hooks/usePeriodColors';

const EventManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, itemName: '', id: null });
  const [data, setData] = useState({ stats: { total: '0', published: '0' }, events: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', dynasty: '', year: '' });
  const { periodColors, getPeriodStyle: getDynastyStyle } = usePeriodColors();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await fetch('/api/admin_events.json');
        if (!eventRes.ok) throw new Error('Events fetch failed');
        const eventResult = await eventRes.json();
        setData(eventResult);
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredEvents = data.events.filter(event => {
    const matchSearch = event.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.sub?.toLowerCase().includes(filters.search.toLowerCase());
    const matchDynasty = filters.dynasty ? event.dynasty === filters.dynasty : true;
    const matchYear = filters.year ? event.time?.includes(filters.year) : true;
    return matchSearch && matchDynasty && matchYear;
  });

  const columns = [
    {
      key: 'name', header: 'Tên sự kiện', render: (row) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center border border-indigo-500/10 shadow-sm shrink-0">
            <span className="material-symbols-outlined text-indigo-600 text-lg">event</span>
          </div>
          <div>
            <div className="font-headline text-on-surface font-bold text-base hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1">{row.name}</div>
            <div className="text-[11px] text-on-surface-variant italic mt-0.5 opacity-80">{row.sub}</div>
          </div>
        </div>
      )
    },
    {
      key: 'time', header: 'Thời gian', render: (row) => (
        <span className="font-body text-sm font-medium text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">schedule</span>
          {row.time}
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
          onEdit={() => navigate(`/admin/events/edit/${row.id}`)}
          onDelete={() => setDeleteModal({ open: true, itemName: row.name, id: row.id })}
        />
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeader
          title="Quản lý Sự kiện Lịch sử"
          subtitle="Lưu trữ và hiệu đính các cột mốc quan trọng trong tiến trình lịch sử dân tộc."
          actionLabel="Thêm sự kiện mới"
          actionHref="/admin/events/new"
          actionIcon="add"
        />

        {/* BENTO STATS */}
        <div className="mb-6">
          <StatsGrid
            stats={[
              { label: 'Tổng sự kiện', value: data.stats.total, icon: 'event_note' },
              { label: 'Đã xuất bản', value: data.stats.published || '0', icon: 'check_circle' }
            ]}
            loading={loading}
          />
        </div>

        {/* FILTER & TABLE SECTION */}
        <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface-low/50">
            <FilterBar>
              <FilterInput
                label="Tìm kiếm:"
                placeholder="Nhập tên sự kiện..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <FilterSelect
                label="Triều đại:"
                options={[
                  { value: '', label: 'Tất cả triều đại' },
                  ...Array.from(new Set(data.events.map(e => e.dynasty))).filter(Boolean).map(d => ({ value: d, label: d }))
                ]}
                value={filters.dynasty}
                onChange={(e) => handleFilterChange('dynasty', e.target.value)}
              />
              <FilterInput
                label="Năm:"
                placeholder="Nhập năm..."
                type="number"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              />
            </FilterBar>
          </div>

          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredEvents}
              loading={loading}
              emptyMessage="Không có sự kiện nào"
              rowKey="id"
              striped={false}
              className="border-0 shadow-none rounded-none"
            />
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        type="delete"
        item={{ name: deleteModal.itemName }}
        onConfirm={() => { alert('Đã xóa'); setDeleteModal({ ...deleteModal, open: false }); }}
      />
    </AdminLayout>
  );
};

export default EventManagement;