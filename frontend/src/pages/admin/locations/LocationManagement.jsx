import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdminLayout,
  PageHeader,
  DataTable,
  ActionModal,
  TableActions,
  VietnamMap,
  Pagination
} from '../../../components/admin';
import UserVietnamMap from '../../../components/VietnamMap';
import { usePeriodColors } from '../../../hooks/usePeriodColors';
import { locationService } from '../../../services';
import { getLocationLabel, getLocationStyle, getLocationIcon } from '../../../utils/locationTypeUtils';
import { getDynastyLabel } from '../../../utils/dynastyUtils';

const LocationManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, name: '', id: null });
  const [data, setData] = useState({ stats: [], locations: [] });
  const [filters, setFilters] = useState({ search: '', type: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { periodColors, getPeriodStyle: getDynastyStyle } = usePeriodColors();
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map'
  const [selectedSite, setSelectedSite] = useState(null);
  const [hoveredSite, setHoveredSite] = useState(null);

  // Conversion formulas from coordinates (lat, lng) to map percentages
  const getXPercent = (lng) => (parseFloat(lng) - 102.1) * 13.5135;
  const getYPercent = (lat) => (23.4 - parseFloat(lat)) * 6.7114;

  const handleDelete = async () => {
    if (deleteModal.id === null || deleteModal.id === undefined) return;

    try {
      await locationService.delete(deleteModal.id);
      setData(prev => ({
        ...prev,
        locations: prev.locations.filter(loc => String(loc.id) !== String(deleteModal.id))
      }));
      if (selectedSite && String(selectedSite.id) === String(deleteModal.id)) {
        setSelectedSite(null);
      }
    } catch (error) {
      console.error('Error deleting location:', error);
    }

    setDeleteModal({ open: false, name: '', id: null });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let dbLocations = [];
        let totalElements = 0;
        try {
          const res = await locationService.filter({ page: 0, size: 500 });
          dbLocations = res.items || [];
          totalElements = res.totalElements || dbLocations.length;
        } catch (apiErr) {
          console.error('Lỗi gọi API địa danh admin:', apiErr);
        }

        let mockLocations = [];
        try {
          const mockRes = await fetch('/api/user_locations.json');
          if (mockRes.ok) {
            const mockData = await mockRes.json();
            mockLocations = mockData.locations || [];
          }
        } catch (err) {
          console.error('Error fetching mock locations in admin:', err);
        }

        let merged = [];
        if (dbLocations.length > 0) {
          merged = dbLocations.map(dbItem => {
            const mockItem = mockLocations.find(m => m.slug === dbItem.slug || m.name === dbItem.name) || {};
            return {
              ...mockItem,
              ...dbItem,
              id: dbItem.id,
              name: dbItem.name,
              type: dbItem.locationType || mockItem.location_type || 'UNKNOWN',
              coords: `${dbItem.latitude || mockItem.latitude || 0}, ${dbItem.longitude || mockItem.longitude || 0}`,
              latitude: dbItem.latitude || mockItem.latitude || null,
              longitude: dbItem.longitude || mockItem.longitude || null,
              period: dbItem.period?.name || mockItem.period || 'Chưa cập nhật',
              dynasties: dbItem.dynasty ? (Array.isArray(dbItem.dynasty) ? dbItem.dynasty : [dbItem.dynasty]) : (mockItem.period ? [mockItem.period] : []),
              status: dbItem.status || 'PUBLISHED',
              description: dbItem.description || mockItem.description || '',
              image: mockItem.image || '',
              famousCharacters: mockItem.famousCharacters || []
            };
          });
        } else {
          merged = mockLocations.map(mockItem => ({
            ...mockItem,
            id: mockItem.location_id,
            name: mockItem.name,
            type: mockItem.location_type || 'UNKNOWN',
            coords: `${mockItem.latitude || 0}, ${mockItem.longitude || 0}`,
            latitude: mockItem.latitude || null,
            longitude: mockItem.longitude || null,
            period: mockItem.period || 'Chưa cập nhật',
            dynasties: mockItem.period ? [mockItem.period] : [],
            status: 'PUBLISHED',
            description: mockItem.description || '',
            image: mockItem.image || '',
            famousCharacters: mockItem.famousCharacters || []
          }));
        }

        setData({
          stats: [
            { id: 1, label: 'Tổng số địa danh', value: totalElements || merged.length, icon: 'location_on', color: 'text-emerald-600' }
          ],
          locations: merged
        });

        if (merged.length > 0) {
          setSelectedSite(merged[0]);
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
    setCurrentPage(1);
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
        <span className={`border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getLocationStyle(row.type)}`}>
          {getLocationLabel(row.type)}
        </span>
      )
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

  const paginatedLocations = filteredLocations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const activeSelectedSite = selectedSite && filteredLocations.find(l => String(l.id) === String(selectedSite.id));

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý Địa danh Lịch sử"
        subtitle="Quản lý và hiệu đính các địa danh, di tích và chiến trường lịch sử."
        actionLabel="Thêm địa danh mới"
        actionHref="/admin/locations/new"
        actionIcon="add_location"
      />

      {/* VIEW MODE TOGGLE */}
      <div className="flex gap-2 mb-6 mt-6">
        <button
          onClick={() => setViewMode('table')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
            viewMode === 'table'
              ? 'bg-primary text-white shadow-md'
              : 'bg-surface-low border border-outline-variant text-on-surface-variant hover:border-primary/30'
          }`}
        >
          <span className="material-symbols-outlined text-sm">table_rows</span>
          Bảng dữ liệu
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
            viewMode === 'map'
              ? 'bg-primary text-white shadow-md'
              : 'bg-surface-low border border-outline-variant text-on-surface-variant hover:border-primary/30'
          }`}
        >
          <span className="material-symbols-outlined text-sm">map</span>
          Bản đồ tương tác
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm p-4 mb-6">
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
                  <option key={t} value={t}>{getLocationLabel(t)}</option>
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

      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <DataTable
                columns={columns}
                data={paginatedLocations}
                loading={loading}
                emptyMessage="Không tìm thấy địa danh nào phù hợp"
                onRowClick={(row) => navigate(`/admin/locations/edit/${row.id}`)}
                rowKey="id"
                striped={false}
                rowClassName={(row) => getNormalizedStatus(row.status) === 'published' ? '!font-semibold border-l-4 border-l-emerald-500 relative z-10' : ''}
                className="border-0 shadow-none rounded-none"
              />
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredLocations.length / itemsPerPage)}
                totalItems={filteredLocations.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-md">
              <div className="p-3 bg-surface-low border-b border-outline-variant flex justify-between items-center">
                <span className="font-body text-[10px] font-bold uppercase tracking-widest text-primary">Bản đồ Di tích</span>
                <span className="material-symbols-outlined text-sm text-primary">explore</span>
              </div>
              <div className="aspect-[4/5] bg-[#fffdf8] relative group overflow-hidden border-b border-outline-variant">
                <UserVietnamMap className="absolute inset-0 w-full h-full opacity-90 group-hover:scale-105 transition-transform duration-[5s] drop-shadow-[0_10px_20px_rgba(158,27,27,0.15)]" />
                
                {filteredLocations.map((site) => {
                  const xVal = site.x !== undefined ? site.x : (site.longitude ? getXPercent(site.longitude) : 50);
                  const yVal = site.y !== undefined ? site.y : (site.latitude ? getYPercent(site.latitude) : 50);
                  
                  return (
                    <div
                      key={site.id}
                      className="absolute w-2 h-2 rounded-full bg-[#9e1b1b] shadow-sm z-10 border border-white"
                      style={{ 
                        left: `${xVal}%`, 
                        top: `${yVal}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  );
                })}

                <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur p-2 rounded text-[9px] font-bold border border-outline-variant uppercase shadow-sm z-20">Bản đồ Di tích Tổng hợp</div>
              </div>
              <div className="p-4">
                <p className="text-xs italic text-on-surface-variant leading-relaxed">"Nơi ghi dấu những chiến công hiển hách của dân tộc trước quân xâm lược."</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MAP VIEW */
        <div className="grid grid-cols-12 gap-8 items-stretch">
          {/* CỘT TRÁI: BẢN ĐỒ TƯƠNG TÁC */}
          <div className="col-span-12 lg:col-span-8 relative bg-[#fffdf8] border border-gray-200 rounded-2xl p-8 shadow-sm overflow-hidden flex flex-col justify-center min-h-[700px]">
            <div className="absolute inset-0 dong-son-pattern opacity-[0.03] pointer-events-none"></div>

            <div className="relative w-full max-w-[450px] aspect-square mx-auto flex items-center justify-center z-10">
              <UserVietnamMap
                className="absolute inset-0 w-full h-full drop-shadow-[0_15px_30px_rgba(158,27,27,0.2)] transition-transform duration-700"
              />

              {filteredLocations.map((site) => {
                const isSelected = activeSelectedSite?.id === site.id;

                const xVal = site.x !== undefined ? site.x : (site.longitude ? getXPercent(site.longitude) : 50);
                const yVal = site.y !== undefined ? site.y : (site.latitude ? getYPercent(site.latitude) : 50);

                return (
                  <div
                    key={site.id}
                    className="absolute cursor-pointer transition-all duration-500 z-20"
                    style={{ left: `${xVal}%`, top: `${yVal}%` }}
                    onClick={() => setSelectedSite(site)}
                    onMouseEnter={() => setHoveredSite(site)}
                    onMouseLeave={() => setHoveredSite(null)}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className={`absolute rounded-full transition-all duration-1000 ${isSelected ? 'w-14 h-14 bg-[#9e1b1b]/20 animate-ping' : 'w-0 h-0'}`} />

                      <div className={`relative w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${isSelected
                        ? 'bg-[#9e1b1b] border-white text-white scale-125 shadow-lg z-30'
                        : 'bg-white border-[#9e1b1b]/30 text-[#9e1b1b] hover:border-[#9e1b1b] z-20'
                        }`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {site.type === 'Hoàng thành' || site.type === 'CITADEL' || site.type === 'CAPITAL' ? 'castle' : (site.type === 'Di tích văn hóa' || site.type === 'TEMPLE') ? 'history_edu' : 'account_balance'}
                        </span>
                      </div>

                      <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm shadow-xl whitespace-nowrap transition-all duration-300 pointer-events-none ${hoveredSite?.id === site.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                        {site.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between items-center text-[10px] font-body font-bold text-gray-400 uppercase tracking-[0.2em]">
              <span>* Chạm vào điểm mốc để diện kiến sử xanh</span>
              <span>Đại Việt Quốc Đồ</span>
            </div>
          </div>

          {/* CỘT PHẢI: CHI TIẾT */}
          <div className="col-span-12 lg:col-span-4 flex flex-col h-full">
            {activeSelectedSite ? (
              <div className="bg-white border border-gray-200 p-6 shadow-sm rounded-2xl flex flex-col h-full min-h-[700px] relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6b0f0d]/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4 relative z-10">
                  <div className="space-y-2">
                    <div className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-lg w-fit text-[10px] font-bold uppercase tracking-wider ${getLocationStyle(activeSelectedSite.type)}`}>
                      <span className="material-symbols-outlined text-[14px]">
                        {getLocationIcon(activeSelectedSite.type)}
                      </span>
                      <span>{getLocationLabel(activeSelectedSite.type)}</span>
                    </div>
                    <h3 className="font-headline text-2xl text-gray-950 font-bold leading-tight">{activeSelectedSite.name}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[9px] uppercase tracking-wider border ${getStatusStyle(getNormalizedStatus(activeSelectedSite.status))}`}>
                    {getStatusLabel(getNormalizedStatus(activeSelectedSite.status))}
                  </span>
                </div>

                {activeSelectedSite.image ? (
                  <div className="w-full h-40 mb-4 relative overflow-hidden rounded-xl border border-gray-200 shadow-sm shrink-0">
                    <img
                      src={activeSelectedSite.image}
                      alt={activeSelectedSite.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 mb-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 shrink-0">
                    <span className="material-symbols-outlined text-4xl mb-1">image</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Không có hình ảnh</span>
                  </div>
                )}

                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-[220px] overflow-y-auto">
                      <p className="font-headline text-sm text-gray-900 mb-1.5 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">menu_book</span> Tóm lược sớ sử
                      </p>
                      <p className="text-gray-600 leading-relaxed font-body text-xs whitespace-pre-line">
                        {activeSelectedSite.description || 'Chưa có thông tin diễn giải lịch sử cho địa danh này.'}
                      </p>
                    </div>

                    {activeSelectedSite.coords && (
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">explore</span> Tọa độ GPS
                        </span>
                        <span className="text-xs font-mono font-bold text-gray-800">{activeSelectedSite.coords}</span>
                      </div>
                    )}

                    {activeSelectedSite.famousCharacters && activeSelectedSite.famousCharacters.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-body text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">history_edu</span> Nhân vật liên quan
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeSelectedSite.famousCharacters.map((char, idx) => {
                            const charName = typeof char === 'string' ? char : char.name;
                            return (
                              <span key={idx} className="px-2.5 py-1 bg-gray-50 text-gray-700 text-[10px] font-bold rounded-lg border border-gray-200 shadow-sm">
                                {charName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex flex-col gap-2 mt-auto">
                    <button
                      onClick={() => navigate(`/admin/locations/edit/${activeSelectedSite.id}`)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      CHỈNH SỬA ĐỊA DANH
                    </button>
                    <button
                      onClick={() => setDeleteModal({ open: true, name: activeSelectedSite.name, id: activeSelectedSite.id })}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      XÓA ĐỊA DANH
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[700px] text-center opacity-40 bg-white border border-gray-200 rounded-2xl p-8">
                <span className="material-symbols-outlined text-[64px] mb-3 text-gray-400">explore</span>
                <p className="font-headline text-lg font-bold text-gray-900">Chọn một điểm di tích trên bản đồ</p>
                <p className="font-body text-xs text-gray-500 mt-1">Hoặc thay đổi bộ lọc ở trên</p>
              </div>
            )}
          </div>
        </div>
      )}

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