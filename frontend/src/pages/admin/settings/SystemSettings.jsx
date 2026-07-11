import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../../components/admin';
import { settingsService } from '../../../services';

const AI_MODEL_OPTIONS = [
  {
    value: 'gpt-oss-120b',
    label: 'GPT-OSS 120B (Groq, Free - tốt nhất)',
    provider: 'Groq',
    note: 'Tốt nhất',
  },
  {
    value: 'gpt-oss-20b',
    label: 'GPT-OSS 20B (Groq, Free - nhanh)',
    provider: 'Groq',
    note: 'Nhanh',
  },
  {
    value: 'llama-3.3-70b',
    label: 'Llama 3.3 70B (Groq, Free)',
    provider: 'Groq',
    note: 'Free',
  },
  {
    value: 'gemma-4-26b',
    label: 'Gemma 4 26B (Google, Free)',
    provider: 'Google',
    note: 'Free',
  },
  {
    value: 'gemma-4-31b',
    label: 'Gemma 4 31B (Google, Free)',
    provider: 'Google',
    note: 'Free',
  },
  {
    value: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash (Google)',
    provider: 'Google',
    note: 'Mặc định',
  },
];

const DEFAULT_SETTINGS = {
  'rag.llm_model': 'gpt-oss-120b',
  'ui.logo_url': '',
  'ui.background_url': '',
};

const SETTING_DESCRIPTIONS = {
  'rag.llm_model': 'Model AI dùng cho hỏi đáp RAG trên giao diện',
  'ui.logo_url': 'Logo hiển thị trên website; có thể là URL hoặc ảnh upload',
  'ui.background_url': 'Ảnh nền website; có thể là URL hoặc ảnh upload',
};

const findModelLabel = (modelValue) => {
  return AI_MODEL_OPTIONS.find(option => option.value === modelValue)?.label || modelValue;
};

const ImageSettingCard = ({ title, subtitle, icon, value, onChange, onApply, previewMode = 'contain' }) => {
  const [urlDraft, setUrlDraft] = useState(value || '');

  useEffect(() => {
    setUrlDraft(value || '');
  }, [value]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageValue = reader.result || '';
      setUrlDraft(imageValue);
      onChange(imageValue);
      onApply?.(imageValue);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const applyUrl = () => {
    const nextValue = urlDraft.trim();
    setUrlDraft(nextValue);
    onChange(nextValue);
    onApply?.(nextValue);
  };

  const clearImage = () => {
    setUrlDraft('');
    onChange('');
    onApply?.('');
  };

  return (
    <section className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-outline-variant/60 flex items-start gap-3">
        <span className="material-symbols-outlined text-[#0f9f6e] text-[22px] mt-0.5">{icon}</span>
        <div>
          <h3 className="font-headline text-lg text-on-surface font-bold">{title}</h3>
          <p className="font-body text-xs text-on-surface-variant mt-1">{subtitle}</p>
        </div>
      </div>

      <div className="p-6 grid lg:grid-cols-[minmax(0,1fr)_280px] gap-6 items-start">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Đường dẫn ảnh
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={urlDraft}
                onChange={event => setUrlDraft(event.target.value)}
                placeholder="https://... hoặc /images/logo.png"
                className="min-w-0 flex-1 h-11 rounded-xl border border-outline-variant/70 bg-surface-low/30 px-4 font-body text-sm outline-none focus:border-[#0f9f6e] focus:ring-2 focus:ring-[#0f9f6e]/15"
              />
              <button
                type="button"
                onClick={applyUrl}
                className="h-11 px-4 rounded-xl border border-outline-variant/70 text-on-surface text-xs font-bold uppercase tracking-widest hover:border-[#0f9f6e] hover:text-[#0f9f6e] transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="h-11 px-4 rounded-xl bg-[#0f9f6e] text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-[#0c8059] transition-colors">
              <span className="material-symbols-outlined text-[17px]">upload</span>
              Upload ảnh
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
            {(value || urlDraft) && (
              <button
                type="button"
                onClick={clearImage}
                className="h-11 px-4 rounded-xl border border-red-200 text-red-700 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[17px]">delete</span>
                Bỏ ảnh
              </button>
            )}
            <button
              type="button"
              onClick={clearImage}
              className="h-11 px-4 rounded-xl border border-[#6b0f0d]/25 text-[#6b0f0d] text-xs font-bold uppercase tracking-widest hover:bg-[#6b0f0d]/5 transition-colors"
            >
              Dùng mặc định
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-outline-variant/70 bg-surface-low/30 min-h-40 overflow-hidden flex items-center justify-center">
          {value ? (
            <img
              src={value}
              alt={title}
              className={`w-full h-full max-h-56 ${previewMode === 'cover' ? 'object-cover' : 'object-contain p-5'}`}
            />
          ) : (
            <div className="text-center text-on-surface-variant p-8">
              <span className="material-symbols-outlined text-4xl opacity-60">image</span>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest">Đang dùng mặc định</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const SystemSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedModel = useMemo(
    () => AI_MODEL_OPTIONS.find(option => option.value === settings['rag.llm_model']),
    [settings]
  );

  const loadSettings = async () => {
    setLoading(true);
    try {
      const list = await settingsService.list();
      const nextSettings = { ...DEFAULT_SETTINGS };

      list.forEach(item => {
        if (Object.prototype.hasOwnProperty.call(nextSettings, item.key)) {
          nextSettings[item.key] = item.value || '';
        }
      });

      setSettings(nextSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSetting = (key, value) => {
    setSettings(previous => ({ ...previous, [key]: value }));
  };

  const applyAppearancePreview = (appearance) => {
    window.dispatchEvent(new CustomEvent('history-rag-settings-updated', {
      detail: { appearance },
    }));
  };

  const applyImageSetting = (key, value, appearance) => {
    updateSetting(key, value);
    applyAppearancePreview(appearance);

    settingsService.upsert({
      key,
      value,
      description: SETTING_DESCRIPTIONS[key],
    }).catch(error => {
      console.error(`Lỗi khi áp dụng ${key}:`, error);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(settings).map(([key, value]) =>
          settingsService.upsert({
            key,
            value,
            description: SETTING_DESCRIPTIONS[key],
          })
        )
      );

      window.dispatchEvent(new Event('history-rag-settings-updated'));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Lỗi khi lưu cài đặt:', error);
      alert('Có lỗi xảy ra khi lưu cài đặt hệ thống!');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-grow min-h-screen bg-surface pb-20 font-body animate-in fade-in duration-500">
      <main className="p-8 max-w-7xl mx-auto w-full space-y-6">
        <PageHeader
          title="Cài đặt hệ thống"
          subtitle="Đổi model AI, logo và background hiển thị trên website."
          icon="settings"
          actionLabel="Làm mới"
          actionIcon="refresh"
          onActionClick={loadSettings}
        />

        <section className="bg-white rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-outline-variant/60 flex items-start gap-3">
            <span className="material-symbols-outlined text-[#0f9f6e] text-[22px] mt-0.5">smart_toy</span>
            <div>
              <h3 className="font-headline text-lg text-on-surface font-bold">AI Model</h3>
              <p className="font-body text-xs text-on-surface-variant mt-1">
                Model dùng cho hỏi đáp AI trên website.
              </p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="max-w-xl space-y-2">
              <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                Model đang dùng
              </label>
              <select
                value={settings['rag.llm_model']}
                onChange={event => updateSetting('rag.llm_model', event.target.value)}
                disabled={loading}
                className="w-full h-12 rounded-xl border border-outline-variant/70 bg-surface-low/30 px-4 font-body text-sm font-semibold text-on-surface outline-none focus:border-[#0f9f6e] focus:ring-2 focus:ring-[#0f9f6e]/15"
              >
                {AI_MODEL_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <div className="rounded-xl border border-outline-variant/50 bg-surface-low/30 p-4">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Provider</p>
                <p className="mt-2 font-bold text-on-surface">{selectedModel?.provider || 'Custom'}</p>
              </div>
              <div className="rounded-xl border border-outline-variant/50 bg-surface-low/30 p-4">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Trạng thái</p>
                <span className="mt-2 inline-flex px-3 py-1 rounded-full bg-[#0f9f6e]/10 text-[#0f9f6e] text-xs font-bold">
                  Active
                </span>
              </div>
              <div className="rounded-xl border border-outline-variant/50 bg-surface-low/30 p-4">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Tên model</p>
                <p className="mt-2 font-bold text-on-surface truncate">{findModelLabel(settings['rag.llm_model'])}</p>
              </div>
            </div>
          </div>
        </section>

        <ImageSettingCard
          title="Logo website"
          subtitle="Logo hiển thị ở header người dùng và sidebar admin."
          icon="imagesmode"
          value={settings['ui.logo_url']}
          onChange={value => updateSetting('ui.logo_url', value)}
          onApply={value => applyImageSetting('ui.logo_url', value, { logoUrl: value })}
        />

        <ImageSettingCard
          title="Background website"
          subtitle="Ảnh nền dùng chung cho giao diện website."
          icon="wallpaper"
          value={settings['ui.background_url']}
          onChange={value => updateSetting('ui.background_url', value)}
          onApply={value => applyImageSetting('ui.background_url', value, { backgroundUrl: value })}
          previewMode="cover"
        />

        <div className="sticky bottom-6 z-30 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="h-12 px-6 rounded-xl bg-[#0f9f6e] text-white shadow-lg hover:bg-[#0c8059] disabled:opacity-60 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">{saving ? 'sync' : 'save'}</span>
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </main>

      {showSuccess && (
        <div className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-8 fade-in z-[200]">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-body font-bold text-sm tracking-wide">Đã lưu cài đặt thành công!</span>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
