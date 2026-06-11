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
  TableActions,
  VietnamMap
} from '../../../components/admin';
import { usePeriodColors } from '../../../hooks/usePeriodColors';

const LocationManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, name: '', id: null });
  const [data, setData] = useState({ stats: [], locations: [] });
  const [filters, setFilters] = useState({ search: '', type: '' });
  const { periodColors, getPeriodStyle: getDynastyStyle } = usePeriodColors();
  const [typeColors, setTypeColors] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locRes, typeColorRes] = await Promise.all([
          fetch('/api/admin_locations.json'),
          fetch('/api/location_type_colors.json')
        ]);
        
        if (!locRes.ok) throw new Error('Locations fetch failed');
        const locResult = await locRes.json();
        setData(locResult);

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

  const getTypeStyle = (type) => {
    if (!type || !typeColors) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    const lowerType = type.toLowerCase();
    
    if (typeColors[lowerType]) return typeColors[lowerType];
    return typeColors['default'] || 'bg-emerald-50 text-emerald-700 border-emerald-200';
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
    return matchSearch && matchType;
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
              <FilterBar>
                <FilterInput
                  label="Tìm kiếm:"
                  placeholder="Nhập tên địa danh..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
                <FilterSelect
                  label="Loại hình:"
                  options={[
                    { value: '', label: 'Tất cả loại hình' },
                    ...Array.from(new Set(data.locations.map(l => l.type))).filter(Boolean).map(t => ({ value: t, label: t }))
                  ]}
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                />
              </FilterBar>
            </div>

            <DataTable
              columns={columns}
              data={filteredLocations}
              loading={loading}
              emptyMessage="Không tìm thấy địa danh nào phù hợp"
              rowKey="id"
              striped={false}
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
        onConfirm={() => setDeleteModal({ open: false })}
        title="Xác nhận xóa?"
        description={`Bạn chắc chắn muốn xóa địa danh <br/><strong className="text-primary italic">"{deleteModal.name}"</strong>? <br/>Dữ liệu này không thể khôi phục.`}
      />
    </AdminLayout>
  );
};

export default LocationManagement;