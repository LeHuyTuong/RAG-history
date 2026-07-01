import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchLocations, deleteLocation } from '../../../store/redux/slices/locationSlice';
import useModalStore from '../../../store/zustand/useModalStore';
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
import { getLocationLabel, getLocationStyle, getLocationIcon } from '../../../utils/locationTypeUtils';
import { getDynastyLabel } from '../../../utils/dynastyUtils';

const LocationManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.locations);
  const { isOpen, modalType, modalData, openModal, closeModal } = useModalStore();

  const [filters, setFilters] = useState({ search: '', type: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { periodColors, getPeriodStyle: getDynastyStyle } = usePeriodColors();
  const [hoveredSite, setHoveredSite] = useState(null);

  // Conversion formulas calibrated for UserVietnamMap projection
  const getXPercent = (lng) => 45.45 + (parseFloat(lng) - 105.3) * 6.14;
  const getYPercent = (lat) => 0.27 + (23.39 - parseFloat(lat)) * 6.394;

  const handleDelete = async () => {
    if (!modalData || modalData.id === null || modalData.id === undefined) return;
    try {
      await dispatch(deleteLocation(modalData.id)).unwrap();
    } catch (error) {
      console.error('Error deleting location:', error);
    }
    closeModal();
  };

  useEffect(() => {
    dispatch(fetchLocations());
  }, [dispatch]);

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
          onDelete={() => openModal('delete', { name: row.name, id: row.id })}
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

      <div className="grid grid-cols-12 gap-8 items-start">
        <div className="col-span-12 lg:col-span-8">
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

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-md">
            <div className="p-3 bg-surface-low border-b border-outline-variant flex justify-between items-center">
              <span className="font-body text-[10px] font-bold uppercase tracking-widest text-primary">Bản đồ Di tích</span>
              <span className="material-symbols-outlined text-sm text-primary">explore</span>
            </div>
            <div className="aspect-[3/4] bg-[#fffdf8] relative group overflow-hidden border-b border-outline-variant flex items-center justify-center">
              <UserVietnamMap className="absolute inset-0 w-full h-full opacity-90 group-hover:scale-105 transition-transform duration-[5s] drop-shadow-[0_10px_20px_rgba(158,27,27,0.15)]" />
              
              {filteredLocations.map((site) => {
                const xVal = site.x !== undefined ? site.x : (site.longitude ? getXPercent(site.longitude) : 50);
                const yVal = site.y !== undefined ? site.y : (site.latitude ? getYPercent(site.latitude) : 50);
                
                return (
                  <div
                    key={site.id}
                    className="absolute cursor-pointer transition-all duration-500 z-20"
                    style={{ left: `${xVal}%`, top: `${yVal}%` }}
                    onClick={() => navigate(`/admin/locations/edit/${site.id}`)}
                    onMouseEnter={() => setHoveredSite(site)}
                    onMouseLeave={() => setHoveredSite(null)}
                  >
                    <div className="relative flex items-center justify-center">
                      <div className={`relative w-4 h-4 flex items-center justify-center rounded-full border border-white bg-[#9e1b1b] text-white shadow-sm hover:scale-150 hover:shadow-lg transition-transform z-20`}>
                      </div>
                      <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold tracking-widest uppercase rounded shadow-lg whitespace-nowrap transition-all duration-300 pointer-events-none ${hoveredSite?.id === site.id ? 'opacity-100 translate-y-0 z-50' : 'opacity-0 translate-y-2 -z-10'}`}>
                        {site.name}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur p-2 rounded text-[9px] font-bold border border-outline-variant uppercase shadow-sm z-20 text-center pointer-events-none">Bản đồ Di tích Tổng hợp</div>
            </div>
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={isOpen && modalType === 'delete'}
        onClose={closeModal}
        type="delete"
        item={{ name: modalData?.name }}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
};

export default LocationManagement;