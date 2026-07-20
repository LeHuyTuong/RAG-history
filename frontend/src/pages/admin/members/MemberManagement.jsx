import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AdminLayout, PageHeader, DataTable, FilterBar, FilterInput, FilterSelect, ActionModal, Pagination } from '../../../components/admin';

import { API_ENDPOINTS, memberService } from '../../../services';
import toast from 'react-hot-toast';
import { IMAGES } from '../../../config/constants';
const MemberManagement = () => {
  const navigate = useNavigate();
  // State quản lý các loại Modal
  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  const [data, setData] = useState({ stats: [], members: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const filteredMembers = data.members.filter(member => {
    const matchSearch = member.name?.toLowerCase().includes(filters.search.toLowerCase());
    const matchStatus = filters.status ? member.status === filters.status : true;
    return matchSearch && matchStatus;
  });

  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let membersList = [];
        try {
          const res = await memberService.filter({ size: 1000 });
          membersList = res.items || [];
        } catch (err) {
          console.error("Failed to load members:", err);
        }

        setData({
          stats: [
            { id: 1, label: 'Tổng số thành viên', value: membersList.length, icon: 'group', color: 'text-indigo-600' },
            { id: 2, label: 'Thành viên đang khóa', value: membersList.filter(m => m.status === 'locked' || m.status === 'LOCKED').length, icon: 'lock', color: 'text-rose-600' }
          ],
          members: membersList.map(m => ({
            id: m.id,
            name: m.name || m.fullName || m.username || m.email,
            email: m.email || '',
            role: m.role || m.roleName || 'Thành viên',
            joinDate: m.joinDate || '',
            status: m.status === 'locked' ? 'locked' : 'active',
            raw: m
          }))
        });
      } catch (error) {
        console.error('Error fetching members data from mock:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const closeModal = () => setActiveModal({ type: null, data: null });

  const handleDelete = async () => {
    if (!activeModal.data || activeModal.data.id === null || activeModal.data.id === undefined) return;
    const deleteId = activeModal.data.id;

    try {
      // Simulate delete locally
      setData(prev => {
        const remaining = prev.members.filter(m => String(m.id) !== String(deleteId));
        return {
          stats: prev.stats.map(s => {
            if (s.label === 'Tổng số thành viên') return { ...s, value: remaining.length };
            if (s.label === 'Thành viên đang khóa') return { ...s, value: remaining.filter(m => m.status === 'locked').length };
            return s;
          }),
          members: remaining
        };
      });
      toast.success('Đã xóa thành viên (chế độ mock)!');
    } catch (error) {
      console.error('Error deleting member:', error);
    } finally {
      closeModal();
    }
  };

  const handleLock = async () => {
    if (!activeModal.data || activeModal.data.id === null || activeModal.data.id === undefined) return;
    const lockId = activeModal.data.id;

    const currentStatus = activeModal.data.status;
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';

    try {
      // Simulate lock/unlock locally
      setData(prev => {
        const updated = prev.members.map(m => {
          if (String(m.id) === String(lockId)) {
            return {
              ...m,
              status: newStatus,
              raw: { ...m.raw, status: newStatus }
            };
          }
          return m;
        });
        return {
          stats: prev.stats.map(s => {
            if (s.label === 'Thành viên đang khóa') return { ...s, value: updated.filter(m => m.status === 'locked').length };
            return s;
          }),
          members: updated
        };
      });
      toast.error(`Đã ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} thành viên (chế độ mock)!`);
    } catch (error) {
      console.error('Error locking/unlocking member:', error);
    } finally {
      closeModal();
    }
  };

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
        />

        {/* STATS GRID */}


        {/* FILTER & MEMBER TABLE */}
        <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface-low/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Nhập tên thành viên..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:font-medium placeholder:opacity-50"
                />
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-primary hover:border-primary/50 transition-all min-w-[150px]"
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Hoạt động</option>
                    <option value="locked">Đã khóa</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-0">
            <DataTable
              columns={columns}
              data={paginatedMembers}
              rowClassName={(row) => row.status === 'active' ? '!font-semibold border-l-4 border-l-emerald-500 relative z-10' : ''}
              className="border-0 shadow-none rounded-none"
            />
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredMembers.length / itemsPerPage)}
              totalItems={filteredMembers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
      </div>

      {/* --- MODAL SYSTEM --- */}
      {activeModal.type === 'view' && <QuickViewModal data={activeModal.data} onClose={closeModal} />}
      {activeModal.type === 'lock' && <LockConfirmModal data={activeModal.data} onClose={closeModal} onConfirm={handleLock} />}
      {activeModal.type === 'delete' && <DeleteConfirmModal data={activeModal.data} onClose={closeModal} onConfirm={handleDelete} />}
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
          <img src={IMAGES.DEFAULT_AVATAR} alt="avatar" />
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
const LockConfirmModal = ({ data, onClose, onConfirm }) => (
  <ActionModal
    isOpen={true}
    onClose={onClose}
    type="lock"
    item={data}
    onConfirm={onConfirm}
  >
    <textarea className="w-full bg-surface-low border border-outline-variant p-3 text-xs mb-2 mt-4 rounded outline-none focus:ring-1 focus:ring-red-600" placeholder="Nhập lý do khóa..." />
  </ActionModal>
);

// MODAL 3: XÁC NHẬN XÓA
const DeleteConfirmModal = ({ data, onClose, onConfirm }) => (
  <ActionModal
    isOpen={true}
    onClose={onClose}
    type="delete"
    item={data}
    onConfirm={onConfirm}
  />
);

export default MemberManagement;
