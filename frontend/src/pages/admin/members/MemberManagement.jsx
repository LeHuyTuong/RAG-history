import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdminLayout, PageHeader, DataTable, StatsGrid, FilterBar, FilterInput, FilterSelect } from '../../../components/admin';

const MemberManagement = () => {
  const navigate = useNavigate();
  // State quản lý các loại Modal
  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  const [data, setData] = useState({ stats: [], members: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredMembers = data.members.filter(member => {
    const matchSearch = member.name?.toLowerCase().includes(filters.search.toLowerCase());
    const matchStatus = filters.status ? member.status === filters.status : true;
    return matchSearch && matchStatus;
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin_members.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching members data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const closeModal = () => setActiveModal({ type: null, data: null });

  const columns = [
    {
      header: 'Thành viên',
      key: 'name',
      render: (member) => (
        <div className="flex items-center gap-4 py-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 flex items-center justify-center border border-indigo-500/10 shadow-sm shrink-0 font-headline font-bold text-indigo-600 text-lg">
            {member.name.charAt(0)}
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-headline text-on-surface font-bold text-sm hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1">{member.name}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Trạng thái',
      key: 'status',
      render: (member) => (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          {member.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
        </span>
      )
    },
    {
      header: 'Ngày tham gia',
      key: 'joinDate',
      render: (member) => (
        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
          {member.joinDate}
        </div>
      )
    },
    {
      header: 'Thao tác',
      key: 'actions',
      align: 'right',
      render: (member) => (
        <div className="flex justify-end gap-1.5">
          <button onClick={() => setActiveModal({ type: 'view', data: member })} className="w-7 h-7 flex items-center justify-center bg-teal-50 text-teal-600 rounded-md transition-all hover:bg-teal-500 hover:text-white" title="Xem nhanh">
            <span className="material-symbols-outlined text-[16px]">visibility</span>
          </button>
          <button onClick={() => navigate(`/admin/members/edit/${member.id}`)} className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded-md transition-all hover:bg-blue-500 hover:text-white" title="Chỉnh sửa">
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
          </button>
          <button onClick={() => setActiveModal({ type: 'lock', data: member })} className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-600 rounded-md transition-all hover:bg-rose-500 hover:text-white" title="Khóa">
            <span className="material-symbols-outlined text-[16px]">block</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <PageHeader
          title="Cộng đồng Sử Việt"
          subtitle="Giám sát các độc giả tham gia tìm hiểu sử liệu."
          actionLabel="Thêm thành viên"
          actionHref="/admin/members/new"
          actionIcon="person_add"
          icon="group"
        />

        {/* STATS GRID */}
        <div className="mb-6">
          <StatsGrid stats={data.stats} loading={loading} />
        </div>

        {/* FILTER & MEMBER TABLE */}
        <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface-low/50">
            <FilterBar>
              <FilterInput
                label="Tìm kiếm:"
                placeholder="Nhập tên thành viên..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <FilterSelect
                label="Trạng thái:"
                options={[
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'active', label: 'Hoạt động' },
                  { value: 'locked', label: 'Đã khóa' }
                ]}
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              />
            </FilterBar>
          </div>

          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredMembers}
              loading={loading}
              emptyMessage="Không tìm thấy thành viên nào phù hợp"
              rowKey="id"
              striped={false}
              className="border-0 shadow-none rounded-none"
            />
          </div>
        </div>
      </div>

      {/* --- MODAL SYSTEM --- */}
      {activeModal.type === 'view' && <QuickViewModal data={activeModal.data} onClose={closeModal} />}
      {activeModal.type === 'lock' && <LockConfirmModal data={activeModal.data} onClose={closeModal} />}
    </AdminLayout>
  );
};

// --- SUB-COMPONENTS & MODALS ---

// MODAL 1: XEM NHANH HỒ SƠ
const QuickViewModal = ({ data, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
      <div className="w-full md:w-1/3 bg-primary text-white p-8 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full border-4 border-accent overflow-hidden mb-4 shadow-lg">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT7Eun6P5a5j9t0Ha7agNr8GmSebCaslKHDba0sUNVH_N_52BCgWQcOKpY3iGdks_qyGhVU9048F4D1LkVsKeVN8s86BCO5TAJj2l2o0ArnWCoqDZUUXPpxZtesKwdi4JGNu3X0EoPzZlT5dgkxjU2GawsCkoLCy0vjYeOP9QSq4zU8gkPiKcSHBLMoIpgNFgNSgWSv3gTB1Y-zSwP7wGtCvPoQOwj3iJp8fRj35VGrIerPL8IypAGaB5cuukoelC1JFRbLwD1CWY" alt="avatar" />
        </div>
        <h3 className="font-headline text-2xl font-bold">{data.name}</h3>
        <div className="mt-8 space-y-3 text-[11px] w-full text-left opacity-80 border-t border-white/20 pt-6">
          <div className="flex justify-between"><span>Gia nhập:</span><span>{data.joinDate}</span></div>
        </div>
        <button onClick={onClose} className="mt-auto w-full py-2 border border-accent text-accent font-bold text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all">Đóng</button>
      </div>
      <div className="flex-1 p-8 bg-surface-low overflow-y-auto max-h-[500px]">
        <h4 className="font-headline text-lg font-bold text-primary border-b border-outline-variant pb-2 mb-4">Hoạt động gần đây</h4>
        <div className="space-y-4 font-body">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-4 rounded border border-outline-variant/30 text-xs italic leading-relaxed text-on-surface-variant">
              "Đã đóng góp hiệu đính cho sử liệu Chiến thắng Ngọc Hồi..."
              <span className="block mt-2 font-body text-[9px] not-italic opacity-50 uppercase tracking-widest">2 giờ trước</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// MODAL 2: XÁC NHẬN KHÓA
const LockConfirmModal = ({ data, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300 border-t-8 border-red-600">
      <span className="material-symbols-outlined text-red-600 text-5xl mb-4">block</span>
      <h3 className="font-headline text-2xl font-bold text-primary mb-2 italic">Khóa tài khoản?</h3>
      <p className="text-sm text-on-surface-variant mb-6 font-body leading-relaxed">Xác nhận đình chỉ quyền truy cập của <br /><strong>"{data.name}"</strong> vào hệ thống Sử Việt?</p>
      <textarea className="w-full bg-surface-low border border-outline-variant p-3 text-xs mb-6 rounded outline-none focus:ring-1 focus:ring-red-600" placeholder="Nhập lý do khóa..." />
      <div className="flex gap-3 font-body text-[11px] font-bold">
        <button onClick={onClose} className="flex-1 py-3 border border-outline rounded-lg hover:bg-surface-low">HỦY BỎ</button>
        <button onClick={() => { alert('Đã khóa'); onClose() }} className="flex-1 py-3 bg-red-600 text-white rounded-lg shadow-md">XÁC NHẬN KHÓA</button>
      </div>
    </div>
  </div>
);

export default MemberManagement;