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
  TableActions,
  VietnamMap
} from '../../../components/admin';
import { usePeriodColors } from '../../../hooks/usePeriodColors';
import { API_ENDPOINTS } from '../../../services/api';
import apiClient from '../../../services/apiClient';

const LocationManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, name: '', id: null });
  const [data, setData] = useState({ stats: [], locations: [] });
  const [filters, setFilters] = useState({ search: '', type: '' });
  const { periodColors, getPeriodStyle: getDynastyStyle } = usePeriodColors();
  const [typeColors, setTypeColors] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleDelete = async () => {
    if (deleteModal.id === null || deleteModal.id === undefined) return;

    try {
      await apiClient.delete(`${API_ENDPOINTS.ADMIN_LOCATIONS}/${deleteModal.id}`);
      setData(prev => ({
        ...prev,
        locations: prev.locations.filter(loc => String(loc.id) !== String(deleteModal.id))
      }));
    } catch (error) {
      console.error('Error deleting location:', error);
    }

    setDeleteModal({ open: false, name: '', id: null });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cùng lúc lấy locations và colors mock
        const [locRes, typeColorRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.ADMIN_LOCATIONS, { params: { page: 0, size: 500 } }),
          fetch(API_ENDPOINTS.LOCATION_TYPE_COLORS)
        ]);

        const payload = locRes.data?.data || locRes.data;
        const locations = payload.result || [];

        setData({
          stats: [
            { id: 1, label: 'Tổng số địa danh', value: payload.meta?.total || locations.length, icon: 'location_on', color: 'text-emerald-600' }
          ],
          locations: locations.map(l => ({
            id: l.id,
            name: l.name,
            type: l.locationType || 'UNKNOWN',
            coords: `${l.latitude || 0}, ${l.longitude || 0}`,
            period: 'Chưa cập nhật',
            dynasties: [],
            status: 'PUBLISHED' // Bảng Location không có status, mock mặc định
          }))
        });

        if (typeColorRes.ok) {
          const typeColorResult = await typeColorRes.json();
          setTypeColors(typeColorResult);
        }
      } catch (error) {
        console.error('Error fetching locations data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getTypeStyle = (type) => {
    if (!type || !typeColors) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    const lowerType = type.toLowerCase();

    if (typeColors[lowerType]) return typeColors[lowerType];
    return typeColors['default'] || 'bg-emerald-50 text-emerald-700 border-emerald-200';
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



  const columns = [
    {
      key: 'name', header: 'Địa danh', render: (row) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/10 shadow-sm shrink-0">
            <span className="material-symbols-outlined text-emerald-600 text-xl">location_on</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-on-surface font-bold text-base hover:text-emerald-600 transition-colors cursor-pointer line-clamp-1">{row.name}</span>
            <span className="font-body text-[11px] text-on-surface-variant mt-0.5 opacity-80 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">explore</span>
              {row.coords}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'type', header: 'Loại hình', render: (row) => (
        <span className={`border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getTypeStyle(row.type)}`}>
          {row.type}
        </span>
      )
    },
    {
      key: 'dynasties', header: 'Triều đại', render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.dynasties?.map((dynasty, idx) => (
            <span key={idx} className={`border px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${getDynastyStyle(dynasty)}`}>
              {dynasty}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'status', header: 'Trạng thái', align: 'center', render: (row) => (
        <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${getStatusStyle(row.status)}`}>
          {getStatusLabel(row.status)}
        </span>
      )
    },
    {
      key: 'actions', header: 'Thao tác', align: 'right', render: (row) => (
        <TableActions
          onEdit={() => navigate(`/admin/locations/edit/${row.id}`)}
          onDelete={() => setDeleteModal({ open: true, name: row.name, id: row.id })}
        />
      )
    }
  ];

  const filteredLocations = data.locations.filter(loc => {
    const matchSearch = loc.name?.toLowerCase().includes(filters.search.toLowerCase());
    const matchType = filters.type ? loc.type === filters.type : true;
    const matchStatus = filters.status ? getNormalizedStatus(loc.status) === filters.status : true;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý Địa danh Lịch sử"
        subtitle="Quản lý và hiệu đính các địa danh, di tích và chiến trường lịch sử."
        actionLabel="Thêm địa danh mới"
        actionHref="/admin/locations/new"
        actionIcon="add_location"
      />

      <div className="mb-6">
        <StatsGrid stats={data.stats} loading={loading} />
      </div>

      <div className="grid grid-cols-12 gap-8 items-start mt-6">
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-outline-variant bg-surface-low/50">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm địa danh (Tên, tọa độ)..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-on-surface placeholder:font-medium placeholder:opacity-50"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="relative">
                    <select
                      value={filters.type}
                      onChange={(e) => handleFilterChange('type', e.target.value)}
                      className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-emerald-500 hover:border-emerald-500/50 transition-all min-w-[160px]"
                    >
                      <option value="">Tất cả loại hình</option>
                      {Array.from(new Set(data.locations.map(l => l.type))).filter(Boolean).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                  </div>

                  <div className="relative">
                    <select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                      className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-emerald-500 hover:border-emerald-500/50 transition-all min-w-[150px]"
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
              data={filteredLocations}
              loading={loading}
              emptyMessage="Không tìm thấy địa danh nào phù hợp"
              onRowClick={(row) => navigate(`/admin/locations/edit/${row.id}`)}
              rowKey="id"
              striped={false}
              rowClassName={(row) => getNormalizedStatus(row.status) === 'published' ? 'bg-emerald-50/80 !font-semibold border-l-4 border-l-emerald-500 shadow-sm relative z-10' : ''}
              className="border-0 shadow-none rounded-none"
            />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-md">
            <div className="p-3 bg-surface-low border-b border-outline-variant flex justify-between items-center">
              <span className="font-body text-[10px] font-bold uppercase tracking-widest text-primary">Bản đồ Di tích</span>
              <span className="material-symbols-outlined text-sm text-primary">explore</span>
            </div>
            <div className="aspect-[4/5] bg-surface-low relative group overflow-hidden border-b border-outline-variant">
              <VietnamMap locations={filteredLocations} className="w-full h-full opacity-90 group-hover:scale-105 transition-transform duration-[5s]" />
              <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur p-2 rounded text-[9px] font-bold border border-outline-variant uppercase shadow-sm">Bản đồ Di tích Tổng hợp</div>
            </div>
            <div className="p-4">
              <p className="text-xs italic text-on-surface-variant leading-relaxed">"Nơi ghi dấu những chiến công hiển hách của dân tộc trước quân xâm lược."</p>
            </div>
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        type="delete"
        item={{ name: deleteModal.name }}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
};

export default LocationManagement;