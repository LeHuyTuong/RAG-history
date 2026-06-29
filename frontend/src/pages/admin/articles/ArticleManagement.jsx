import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { postService } from '../../../services';

const ArticleManagement = () => {
  const navigate = useNavigate();
  const [modal, setModal] = useState({ open: false, type: '', item: null });
  const [data, setData] = useState({ stats: [], articles: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', tag: '', author: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { periodColors, getPeriodStyle } = usePeriodColors();

  const handleDelete = async () => {
    if (!modal.item || modal.item.id === null || modal.item.id === undefined) return;
    const deleteId = modal.item.id;

    try {
      await postService.delete(deleteId);
      setData(prev => ({
        ...prev,
        articles: prev.articles.filter(a => String(a.id) !== String(deleteId))
      }));
    } catch (error) {
      console.error('Error deleting article:', error);
    }

    closeModal();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { items: posts, totalElements } = await postService.filter({ page: 0, size: 500 });

        setData({
          stats: [
            { id: 1, label: 'Tổng số bài viết', value: totalElements || posts.length, icon: 'article', color: 'text-primary' },
            { id: 2, label: 'Đã xuất bản', value: posts.filter(p => p.status === 'PUBLISHED').length, icon: 'check_circle', color: 'text-emerald-600' }
          ],
          articles: posts.map(p => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            summary: p.summary,
            tags: p.tags && p.tags.length > 0 ? p.tags.map(t => t.name) : ['Chưa rõ'],
            author: p.author?.fullName || p.author?.username || 'Admin',
            status: p.status
          }))
        });
      } catch (error) {
        console.error('Error fetching articles data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openModal = (type, item) => setModal({ open: true, type, item });
  const closeModal = () => setModal({ open: false, type: '', item: null });

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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 shadow-sm shrink-0">
            <span className="material-symbols-outlined text-primary text-xl">history_edu</span>
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
        isOpen={modal.open}
        onClose={closeModal}
        type={modal.type}
        item={modal.item}
        onConfirm={handleDelete}
      />
    </AdminLayout>
  );
};

export default ArticleManagement;