import {  useState, useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AdminLayout,
  PageHeader,
  FilterBar,
  FilterInput,
  FilterSelect,
  DataTable,
  ActionModal,
  StatsGrid,
  TableActions
} from '../../../components/admin';
import { usePeriodColors } from '../../../hooks/usePeriodColors';

const ArticleManagement = () => {
  const navigate = useNavigate();
  const [modal, setModal] = useState({ open: false, type: '', item: null });
  const [data, setData] = useState({ stats: [], articles: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', period: '', author: '' });
  const { periodColors, getPeriodStyle } = usePeriodColors();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const articleRes = await fetch('/api/admin_articles.json');
        if (!articleRes.ok) throw new Error('Articles fetch failed');
        const articleResult = await articleRes.json();
        setData(articleResult);
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
  };

  const filteredArticles = data.articles.filter(article => {
    const matchSearch = article.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      article.slug.toLowerCase().includes(filters.search.toLowerCase());
    const matchStatus = filters.status ? article.status === filters.status : true;
    const matchPeriod = filters.period ? article.period === filters.period : true;
    const matchAuthor = filters.author ? article.author === filters.author : true;
    return matchSearch && matchStatus && matchPeriod && matchAuthor;
  });

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
      key: 'period', header: 'Thời kỳ', render: (row) => (
        <span className={`border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPeriodStyle(row.period)}`}>
          {row.period}
        </span>
      )
    },
    {
      key: 'author', header: 'Tác giả', render: (row) => (
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
        <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${getStatusStyle(row.status)}`}>
          {getStatusLabel(row.status)}
        </span>
      )
    },
    {
      key: 'actions', header: 'Thao tác', align: 'right', render: (row) => (
        <TableActions
          onEdit={() => navigate(`/admin/articles/edit/${row.id}`)}
          onArchive={() => openModal('archive', row)}
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

        {/* BENTO STATS */}
        <div className="mb-6">
          <StatsGrid stats={data.stats} loading={loading} />
        </div>

        {/* FILTER & TABLE SECTION */}
        <div className="bg-surface border border-outline-variant rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-outline-variant bg-surface-low/50">
            <FilterBar>
              <FilterInput
                label="Tìm kiếm:"
                placeholder="Nhập tên bài viết, mã số..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <FilterSelect
                label="Thời kỳ:"
                options={[
                  { value: '', label: 'Tất cả thời kỳ' },
                  ...Array.from(new Set(data.articles.map(a => a.period))).filter(Boolean).map(p => ({ value: p, label: p }))
                ]}
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
              />
              <FilterSelect
                label="Tác giả:"
                options={[
                  { value: '', label: 'Tất cả tác giả' },
                  ...Array.from(new Set(data.articles.map(a => a.author))).filter(Boolean).map(a => ({ value: a, label: a }))
                ]}
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
              />
              <FilterSelect
                label="Trạng thái:"
                options={[
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'published', label: 'Công khai' },
                  { value: 'draft', label: 'Bản nháp' }
                ]}
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              />
            </FilterBar>
          </div>

          <div className="p-0">
            <DataTable
              columns={columns}
              data={filteredArticles}
              loading={loading}
              emptyMessage="Không tìm thấy bài viết nào phù hợp"
              rowKey="id"
              striped={false}
              rowClassName={(row) => row.status === 'published' ? 'bg-emerald-50/80 !font-semibold border-l-4 border-l-emerald-500 shadow-sm relative z-10' : ''}
              className="border-0 shadow-none rounded-none"
            />
          </div>
        </div>
      </div>

      <ActionModal
        isOpen={modal.open}
        onClose={closeModal}
        type={modal.type}
        item={modal.item}
        onConfirm={() => { alert('Thao tác thành công!'); closeModal(); }}
      />
    </AdminLayout>
  );
};

export default ArticleManagement;