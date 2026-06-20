import { useState, useEffect } from 'react';
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

import { API_ENDPOINTS } from '../../../services/api';
const EventManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, itemName: '', id: null });
  const [data, setData] = useState({ stats: { total: '0', published: '0' }, events: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', dynasty: '', year: '', status: '' });
  const { periodColors, getPeriodStyle: getDynastyStyle } = usePeriodColors();

  const handleDelete = () => {
    if (deleteModal.id === null || deleteModal.id === undefined) return;
    const deleteId = deleteModal.id;

    let newEvents = JSON.parse(localStorage.getItem('admin_new_events') || '[]');
    newEvents = newEvents.filter(item => String(item.id) !== String(deleteId));
    localStorage.setItem('admin_new_events', JSON.stringify(newEvents));

    const deletedIds = JSON.parse(localStorage.getItem('admin_deleted_ids') || '[]');
    if (!deletedIds.includes(String(deleteId))) {
      deletedIds.push(String(deleteId));
      localStorage.setItem('admin_deleted_ids', JSON.stringify(deletedIds));
    }

    setData(prev => {
      const nextEvents = prev.events.filter(e => String(e.id) !== String(deleteId));
      const deletedCount = deletedIds.length;

      return {
        ...prev,
        stats: {
          total: (nextEvents.length).toLocaleString(),
          published: (nextEvents.filter(e => {
            const s = e.status || '';
            return s.toLowerCase() === 'published' || s.toLowerCase() === 'công khai';
          }).length).toLocaleString()
        },
        events: nextEvents
      };
    });

    setDeleteModal({ open: false, itemName: '', id: null });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { default: apiClient } = await import('../../../services/apiClient');
        const eventRes = await apiClient.get(API_ENDPOINTS.ADMIN_EVENTS, { params: { page: 0, size: 500 } });
        const content = eventRes.data?.data?.result || eventRes.data?.data?.content || [];

        const eventResult = { events: [], stats: { total: '0', published: '0' } };
        
        eventResult.events = content.map(e => ({
          ...e,
          time: `${e.startYear || '?'} - ${e.endYear || '?'}`,
          dynasty: e.periodName || 'Chưa rõ',
          status: e.status || 'published',
          sub: e.description || ''
        }));

        // Merge new events from localStorage
        const newEventsStr = localStorage.getItem('admin_new_events');
        const deletedIds = JSON.parse(localStorage.getItem('admin_deleted_ids') || '[]');
        if (newEventsStr) {
          try {
            const newEventsRaw = JSON.parse(newEventsStr);
            const newEvents = newEventsRaw.map(e => ({
              ...e,
              name: e.name || e.title,
              time: e.time || e.startDate || e.date,
              dynasty: e.dynasty || e.period || "Chưa cập nhật",
              status: e.status === 'published' ? 'published' : 'draft'
            }));

            const newEventIds = new Set(newEvents.map(e => String(e.id)));
            const deletedSet = new Set(deletedIds.map(String));
            eventResult.events = [
              ...newEvents,
              ...eventResult.events.filter(e => !newEventIds.has(String(e.id)) && !deletedSet.has(String(e.id)))
            ];
          } catch (e) { console.error('Error parsing new events', e); }
        } else {
          const deletedSet = new Set(deletedIds.map(String));
          eventResult.events = eventResult.events.filter(e => !deletedSet.has(String(e.id)));
        }

        // Calculate stats dynamically based on actual data
        eventResult.stats = {
          total: eventResult.events.length.toLocaleString(),
          published: eventResult.events.filter(e => {
            const s = e.status || '';
            return s.toLowerCase() === 'published' || s.toLowerCase() === 'công khai';
          }).length.toLocaleString()
        };

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
  };

  const filteredEvents = data.events.filter(event => {
    const matchSearch = event.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      event.sub?.toLowerCase().includes(filters.search.toLowerCase());
    const matchDynasty = filters.dynasty ? event.dynasty === filters.dynasty : true;
    const matchYear = filters.year ? event.time?.includes(filters.year) : true;
    const matchStatus = filters.status ? getNormalizedStatus(event.status) === filters.status : true;
    return matchSearch && matchDynasty && matchYear && matchStatus;
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
      key: 'dynasty', header: 'Triều đại', align: 'center', render: (row) => {
        const dynasties = Array.isArray(row.dynasties) && row.dynasties.length > 0
          ? row.dynasties
          : (row.dynasty ? (Array.isArray(row.dynasty) ? row.dynasty : [row.dynasty]) : []);

        return (
          <div className="flex flex-wrap items-center justify-center gap-1 max-w-[200px] mx-auto">
            {dynasties.map((d, i) => (
              <span key={i} className={`border px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getDynastyStyle(d)}`}>
                {d}
              </span>
            ))}
          </div>
        );
      }
    },
    {
      key: 'status', header: 'Trạng thái', align: 'center', render: (row) => (
        <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${getStatusStyle(getNormalizedStatus(row.status))}`}>
          {getStatusLabel(getNormalizedStatus(row.status))}
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
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Nhập tên sự kiện..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-on-surface placeholder:font-medium placeholder:opacity-50"
                />
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <select
                    value={filters.dynasty}
                    onChange={(e) => handleFilterChange('dynasty', e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-indigo-500 hover:border-indigo-500/50 transition-all min-w-[160px]"
                  >
                    <option value="">Tất cả triều đại</option>
                    {Array.from(new Set(data.events.map(e => e.dynasty))).filter(Boolean).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>

                <div className="relative">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-indigo-500 hover:border-indigo-500/50 transition-all min-w-[150px]"
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

          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredEvents}
              loading={loading}
              emptyMessage="Không có sự kiện nào"
              onRowClick={(row) => navigate(`/admin/events/edit/${row.id}`)}
              rowKey="id"
              striped={false}
              rowClassName={(row) => getNormalizedStatus(row.status) === 'published' ? 'bg-emerald-50/80 !font-semibold border-l-4 border-l-emerald-500 shadow-sm relative z-10' : ''}
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

export default EventManagement;