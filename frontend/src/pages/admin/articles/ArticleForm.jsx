import {  useState, useEffect  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, ImageUpload, TagInput, FormHeader } from '../../../components/admin';

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [predefinedTags, setPredefinedTags] = useState([]);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'Bản thảo',
    publishedAt: '',
    tags: [],
    thumbnailUrl: null,
    thumbnailPreview: null
  });

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/user_article_detail.json');
          if (response.ok) {
            const data = await response.json();
            const mockContent = data.content?.map(c => c.text).join('<br/><br/>') || '';
            setForm(prev => ({
              ...prev,
              title: data.title || '',
              slug: generateSlug(data.title || ''),
              content: mockContent,
              status: 'Đã xuất bản',
              publishedAt: data.publishedAt || '',
              tags: data.tags || ['Bình Ngô Đại Cáo'],
              thumbnailUrl: null,
              thumbnailPreview: data.heroImage || null
            }));
          }
        } catch (error) {
          console.error('Lỗi tải dữ liệu bài viết:', error);
        }
      };
      fetchData();
    }

    const fetchTags = async () => {
      try {
        const response = await fetch('/api/admin_metadata.json');
        if (response.ok) {
          const data = await response.json();
          if (data.tags) {
            setPredefinedTags(data.tags.map(t => ({
              id: t.id,
              label: t.name,
              category: t.type || 'Phân loại'
            })));
          }
        }
      } catch (error) {
        console.error('Lỗi tải danh sách thẻ:', error);
      }
    };
    fetchTags();
  }, [id, isEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({
        ...form,
        thumbnailUrl: file,
        thumbnailPreview: URL.createObjectURL(file)
      });
    }
  };

  const handleAddTag = (tagName) => {
    setForm(prev => ({ ...prev, tags: [...new Set([...(prev.tags || []), tagName])] }));
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-body">
      <FormHeader 
        title={isEdit ? 'Hiệu đính Sử liệu' : 'Soạn thảo Bài viết Mới'}
        subtitle='"Ghi chép ngàn năm, lưu truyền vạn thế"'
        icon="history_edu"
        isEdit={isEdit}
        onCancel={() => navigate('/admin/articles')}
        onSave={() => {}}
        saveText="Xuất bản"
      />

      <div className="grid grid-cols-12 gap-8">
        {/* Main Editor Section */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Title Area */}
          <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md relative overflow-hidden">
            <div className="absolute -top-12 -right-12 opacity-[0.02] text-primary pointer-events-none">
              <span className="material-symbols-outlined text-[200px]">article</span>
            </div>

            <div className="space-y-2 relative z-10">
              <label className="font-body text-[11px] uppercase font-bold text-on-surface-variant tracking-widest block flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">title</span>
                Tiêu đề sử liệu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text" value={form.title}
                onChange={e => {
                  const newTitle = e.target.value;
                  setForm({ ...form, title: newTitle, slug: generateSlug(newTitle) });
                }}
                className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                placeholder="Nhập tiêu đề trang trọng..."
              />
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant font-body text-[12px] bg-surface-low/50 p-3 rounded-xl border border-outline-variant/40">
              <span className="material-symbols-outlined text-[16px] text-primary">link</span>
              <span className="opacity-70 tracking-normal">suviet.vn/bai-viet/</span>
              <input
                type="text" value={form.slug} readOnly
                className="flex-1 bg-transparent outline-none text-primary font-bold cursor-not-allowed opacity-90"
              />
            </div>
          </section>

          {/* Content Area */}
          <section className="bg-white rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="p-4 bg-surface-low/30 border-b border-outline-variant/60 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_document</span>
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest">Nội dung bài viết</h3>
            </div>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm({ ...form, content })}
              placeholder="Bắt đầu soạn thảo dòng lịch sử..."
              className="h-[600px] flex flex-col custom-quill"
            />
          </section>
        </div>

        {/* Sidebar Section */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-3xl shadow-xl sticky top-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
            <div className="bg-surface/95 backdrop-blur-xl p-6 rounded-[22px] h-full border border-white/10 flex flex-col space-y-6 relative">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                Cấu hình Bài viết
              </h4>

              {/* Publishing Info */}
              <div className="space-y-4 relative z-10">
                <p className="font-body text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">publish</span> Xuất bản
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</label>
                    <div className="relative">
                      <select
                        value={form.status}
                        onChange={e => setForm({ ...form, status: e.target.value })}
                        className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                      >
                        <option>Bản thảo</option>
                        <option>Đã xuất bản</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ngày xuất bản</label>
                    <input
                      type="date"
                      value={form.publishedAt}
                      onChange={e => setForm({ ...form, publishedAt: e.target.value })}
                      className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <TagInput
                tags={form.tags}
                availableTags={predefinedTags}
                onAddTag={handleAddTag}
                onRemoveTag={handleRemoveTag}
              />

              <ImageUpload
                previewUrl={form.thumbnailPreview}
                onImageChange={handleImageChange}
                onRemove={() => setForm({ ...form, thumbnailUrl: null, thumbnailPreview: null })}
              />

            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ArticleForm;