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
import { resolveImageUrl } from '../../../utils/imageUtils';
import { getDynastyLabel } from '../../../utils/dynastyUtils';
import { getXPercent, getYPercent } from '../../../utils/mapCoordinates';
import { TEXTURES } from '../../../config/constants';

const LocationManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.locations);
  const { isOpen, modalType, modalData, openModal, closeModal } = useModalStore();

  const [filters, setFilters] = useState({ search: '', type: '', dynasty: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { periodColors, getPeriodStyle: getDynastyStyle } = usePeriodColors();
  const [hoveredSite, setHoveredSite] = useState(null);

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
      key: 'name', header: 'Di tích', render: (row) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center border border-emerald-500/10 shadow-sm shrink-0 overflow-hidden">
            {(row.imageUrl || row.image) ? (
              <img src={resolveImageUrl(row.imageUrl || row.image) + '?v=2'} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-emerald-600 text-xl">location_on</span>
            )}
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
    const matchDynasty = filters.dynasty
      ? (loc.dynasties?.includes(filters.dynasty) || loc.dynasty === filters.dynasty)
      : true;
    const matchStatus = filters.status ? getNormalizedStatus(loc.status) === filters.status : true;
    return matchSearch && matchType && matchDynasty && matchStatus;
  });

  const paginatedLocations = filteredLocations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý Di tích Lịch sử"
        subtitle="Quản lý và hiệu đính các di tích, di tích và chiến trường lịch sử."
        actionLabel="Thêm di tích mới"
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
              placeholder="Tìm kiếm di tích (Tên, tọa độ)..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:font-medium placeholder:opacity-50"
            />
          </div>
          <div className="flex gap-4">
            <select
              className="px-4 py-2 bg-surface-low border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all w-[180px]"
              value={filters.dynasty}
              onChange={(e) => handleFilterChange('dynasty', e.target.value)}
            >
              <option value="">Tất cả triều đại</option>
              {periodColors && Object.keys(periodColors).map(dynasty => (
                <option key={dynasty} value={dynasty}>{getDynastyLabel(dynasty)}</option>
              ))}
            </select>
            <div className="relative">
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-primary hover:border-primary/50 transition-all min-w-[160px]"
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
                className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-primary hover:border-primary/50 transition-all min-w-[150px]"
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
              emptyMessage="Không tìm thấy di tích nào phù hợp"
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

        <div className="col-span-12 lg:col-span-4 sticky top-8">
          <div className="bg-[#fcfaf2] border-2 border-[#e2dcc8] rounded-3xl overflow-hidden shadow-2xl relative group">

            {/* Antique Frame Decoration */}
            <div className="absolute inset-3 border border-[#e2dcc8] pointer-events-none z-10 rounded-2xl"></div>

            <div className="p-4 bg-[#e2dcc8]/30 border-b border-[#e2dcc8] flex justify-between items-center relative z-20">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#6b4226]">Bản đồ Địa linh</span>
              <span className="material-symbols-outlined text-[#6b4226] text-sm">history_edu</span>
            </div>

            {/* Map Canvas */}
            <div className="aspect-[3/4] relative overflow-hidden bg-[url(TEXTURES.PARCHMENT)] bg-repeat flex items-center justify-center">
              <div className="relative w-full aspect-square">
                <div className="absolute inset-0 grayscale-[0.3] sepia-[0.4] opacity-90 transition-transform duration-[10s] group-hover:scale-110">
                  <UserVietnamMap className="w-full h-full" />
                </div>

                {/* Plotting Markers */}
                {filteredLocations.map((site) => {
                  const x = getXPercent(site.longitude);
                  const y = getYPercent(site.latitude);
                  if (isNaN(x) || isNaN(y)) return null;

                  return (
                    <div
                      key={site.id}
                      className="absolute z-30 group/marker"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      onMouseEnter={() => setHoveredSite(site)}
                      onMouseLeave={() => setHoveredSite(null)}
                      onClick={() => navigate(`/admin/locations/edit/${site.id}`)}
                    >
                      {/* Marker: Wax Seal Style */}
                      <div className="relative -translate-x-1/2 -translate-y-1/2 cursor-pointer">
                        <div className="w-3.5 h-3.5 bg-[#9e1b1b] rounded-full border-2 border-[#fcfaf2] shadow-[0_2px_10px_rgba(158,27,27,0.4)] group-hover/marker:scale-150 transition-transform duration-300"></div>

                        {/* Tooltip Label */}
                        <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#2d1b0e] text-[#fcfaf2] rounded-lg shadow-2xl transition-all duration-300 pointer-events-none whitespace-nowrap z-50 ${hoveredSite?.id === site.id ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90'}`}>
                          <p className="font-headline text-xs font-bold">{site.name}</p>
                          <p className="font-mono text-[8px] opacity-60 text-center uppercase tracking-tighter mt-0.5">{site.latitude}, {site.longitude}</p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#2d1b0e]"></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Map Footer */}
            <div className="p-5 bg-white/50 border-t border-[#e2dcc8] text-center relative z-20">
              <p className="font-mono text-[9px] uppercase font-bold text-[#6b4226] tracking-widest opacity-70">
                Hệ thống tọa độ sử liệu quốc gia
              </p>
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
