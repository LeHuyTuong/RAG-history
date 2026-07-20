import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchArticles, deleteArticle } from '../../../store/redux/slices/articleSlice';
import useModalStore from '../../../store/zustand/useModalStore';
import {
  AdminLayout,
  PageHeader,
  FilterBar,
  FilterInput,
  FilterSelect,
  DataTable,
  ActionModal,
  TableActions,
  Pagination
} from '../../../components/admin';
import { usePeriodColors } from '../../../hooks/usePeriodColors';

import { resolveImageUrl } from '../../../utils/imageUtils';

const getFallbackImage = (period) => {
  console.log('[DEBUG] getFallbackImage called with period:', period);
  if (!period) return "/images/post_history.png";
  const periodName = typeof period === 'object' ? (period.name || period.title || '') : period;
  if (!periodName || typeof periodName !== 'string') return "/images/post_history.png";
  const name = periodName.toLowerCase();
  console.log('[DEBUG] getFallbackImage periodName:', periodName, 'name:', name);
  if (name.includes('hùng vương') || name.includes('hồng bàng') || name.includes('âu lạc') || name.includes('văn lang')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuCVTT2QqvD6K9-wucC1WkR7VZnFnP0rjHn6TrcyVqbMkCLEt-GrSb7RFMcwfuFYl9579qyI-CbhlttwgMYFgZtqaEK6hcj7gIzEvC-x8r1WJkxShSTdvgJAiGZim3mnjYlIdJsvmeUw2bip5ou99uGqVBVApXptp6Lpy5LmjEOMY2yZYFGSQzjZdZ5ZBKHO-vZMXFRcwX7gOF6f0s6dB3ZlO7K3KuUYQcdtVpUeP-fDnTut1_okhKeJqvG2OJTJ0xZCroTJlNoWryp1";
  if (name.includes('lý') || name.includes('ngô') || name.includes('đinh') || name.includes('tiền lê')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuB-vfyWu8AZJ8zXJcGYqxgtuwF8kgnNnxqHfqVCWu6IexNxd58MLyYryN2Pd4GPPIwQcgir92iGx39PPcocu5YwY0dKB88RM80ItVGkDs80nIlov0g4PRkKkWZqNqeAX2cgwfngoBoFqIt07Pir--2qzfNsUbTW8P_bXbYNjOL9IKt34YPVLuKa93Sk3GhQCaHLTecwGQGCZuSq0bnrOOq6oXKKmx5RiNGxRXHOQb6CiTjXlTeHajpZq_8iG4JClpUY9GWZsiRXvkTh";
  if (name.includes('trần') || name.includes('hồ') || name.includes('khúc') || name.includes('dương')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuBArlscw3wc_0llom4YXbNv7OUtmTW1u8adGJtB0r_R9ouLWRlOhBtwANhi8h-y-oKCXyjtcMAw-fv_DqJa8j9I0UYbf6VIaYfgHL50aCXOYoKCdQKYmjZdoMl1JYnzrRbkzkf79To66-2d-f1XfB1xrJTtxZoVqJiuNrqbgJSqttpHAF3wZGHnereJFQmlr7zvRv_OYZP3ifnXN8WYT8_1w8_n43OLOx1lJp01FpEjYuFGNSEqolT22CJMX1LelRwU2FVHe3Qq_fbP";
  if (name.includes('lê') || name.includes('mạc') || name.includes('trịnh') || name.includes('nguyễn') || name.includes('tây sơn')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuDDTXt3tOmQLzCboBJbQ63U5COKxdxaq5GrOn1775TXtXg3zq28AuTTb3mfVjKs6uj5Nkhc7auEFnCrMuCs6G4YIcZmzBgEE4ZdY3awqlP12VklH3BWkRe6Q83fhxNWatx1MbYcLIq7RztTsqI3HQRxPVW7T-TPQdwD7HM2eOSpwVHwup9Hp3K7KuNRjtoiaNSNbwvYXV_yv4pvRx5WIpTl05zH0YYusegbAB7v9qKEqrHI9SzL2DI2Hb0snIW35b9H7yKKrRRXIf79";
  
  if (name.includes('quân sự') || name.includes('chiến thắng') || name.includes('khởi nghĩa') || name.includes('kháng chiến') || name.includes('trận') || name.includes('điện biên phủ') || name.includes('độc lập')) return "/images/post_war.png";
  if (name.includes('văn hóa') || name.includes('xã hội') || name.includes('kinh tế') || name.includes('văn học') || name.includes('cải cách')) return "/images/post_culture.png";
  if (name.includes('lịch sử') || name.includes('tổng hợp') || name.includes('chính trị') || name.includes('cổ đại') || name.includes('cận đại') || name.includes('triều đại') || name.includes('bắc thuộc') || name.includes('địa danh')) return "/images/post_history.png";
  return "/images/post_history.png";
};

const ArticleManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.articles);
  const { isOpen, modalType, modalData, openModal, closeModal } = useModalStore();

  const [filters, setFilters] = useState({ search: '', status: '', tag: '', author: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { periodColors, getPeriodStyle } = usePeriodColors();

  const handleDelete = async () => {
    if (!modalData || modalData.id === null || modalData.id === undefined) return;
    try {
      await dispatch(deleteArticle(modalData.id)).unwrap();
      dispatch(fetchArticles({ page: 0, size: 500 })); // Refetch to guarantee sync
      if (paginatedArticles.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error deleting article:', error);
    }
    closeModal();
  };

  useEffect(() => {
    dispatch(fetchArticles({ page: 0, size: 500 }));
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

  const filteredArticles = data.articles.filter(article => {
    const matchSearch = article.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      article.slug.toLowerCase().includes(filters.search.toLowerCase());
    const matchStatus = filters.status ? getNormalizedStatus(article.status) === filters.status : true;
    const matchTag = filters.tag ? article.tags.includes(filters.tag) : true;
    const matchAuthor = filters.author ? article.author === filters.author : true;
    return matchSearch && matchStatus && matchTag && matchAuthor;
  });

  const paginatedArticles = filteredArticles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const columns = [
    {
      key: 'title', header: 'Sử liệu / Mã số', render: (row) => (
        <div className="flex items-center gap-4 py-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm shrink-0 overflow-hidden">
            {(row.thumbnailUrl || row.image) ? (
              <img 
                src={resolveImageUrl(row.thumbnailUrl || row.image) + '?v=2'} 
                alt={row.title} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.target.onerror = null;
                  const dynasty = (row.tags || [])[0] || '';
                  e.target.src = getFallbackImage(dynasty);
                }}
              />
            ) : (
              <span className="material-symbols-outlined text-primary text-xl">history_edu</span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-headline text-on-surface font-bold text-base hover:text-primary transition-colors cursor-pointer line-clamp-1">{row.title}</span>
            <span className="font-body text-[11px] text-on-surface-variant mt-0.5 opacity-80 flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">link</span>
              {row.slug}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'tags', header: 'Thời kỳ / Triều đại', render: (row) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {row.tags.map((t, idx) => (
            <span key={idx} className={`border px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPeriodStyle(t)}`}>
              {t}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'author', header: 'Người tạo', render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold text-on-surface uppercase shrink-0">
            {row.author.charAt(0)}
          </div>
          <span className="text-on-surface font-body text-sm font-medium">{row.author}</span>
        </div>
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
          onEdit={() => navigate(`/admin/articles/edit/${row.id}`)}
          onDelete={() => openModal('delete', row)}
        />
      )
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <PageHeader
          title="Quản lý Bài viết Lịch sử"
          subtitle="Lưu trữ và hiệu đính các bản ghi chép về các triều đại, sự kiện và nhân vật quan trọng."
          actionLabel="Thêm bài viết mới"
          actionHref="/admin/articles/new"
          actionIcon="add"
        />



        {/* FILTER & TABLE SECTION */}
        <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface-low/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input
                  type="text"
                  placeholder="Nhập tên bài viết, mã số..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-on-surface placeholder:font-medium placeholder:opacity-50"
                />
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <select
                    value={filters.tag}
                    onChange={(e) => handleFilterChange('tag', e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-primary hover:border-primary/50 transition-all min-w-[160px]"
                  >
                    <option value="">Tất cả thời kỳ / triều đại</option>
                    {Array.from(new Set(data.articles.flatMap(a => a.tags || []))).filter(t => t && t !== 'Chưa rõ').map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                </div>

                <div className="relative">
                  <select
                    value={filters.author}
                    onChange={(e) => handleFilterChange('author', e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface outline-none cursor-pointer focus:border-primary hover:border-primary/50 transition-all min-w-[150px]"
                  >
                    <option value="">Tất cả người tạo</option>
                    {Array.from(new Set(data.articles.map(a => a.author))).filter(Boolean).map(a => (
                      <option key={a} value={a}>{a}</option>
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

          <div className="p-0">
            <DataTable
              columns={columns}
              data={paginatedArticles}
              loading={loading}
              emptyMessage="Không tìm thấy bài viết nào phù hợp"
              onRowClick={(row) => navigate(`/admin/articles/edit/${row.id}`)}
              rowKey="id"
              striped={false}
              rowClassName={(row) => getNormalizedStatus(row.status) === 'published' ? '!font-semibold border-l-4 border-l-emerald-500 relative z-10' : ''}
              className="border-0 shadow-none rounded-none"
            />
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredArticles.length / itemsPerPage)}
              totalItems={filteredArticles.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={isOpen && modalType === 'delete'}
        onClose={closeModal}
        type="delete"
        item={modalData}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
};

export default ArticleManagement;
