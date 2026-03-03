import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToastStore } from '../stores/toastStore';
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Star,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Folder,
  Sprout,
} from 'lucide-react';

interface TrendCategory {
  id: string;
  slug: string;
  name: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
}

interface VideoTrend {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  videoUrl: string;
  thumbnailUrl: string;
  referenceVideoUrl: string;
  model: string;
  promptTemplate: string;
  negativePrompt: string;
  duration: number;
  aspectRatio: string;
  tokenCost: number;
  categoryId: string;
  category?: TrendCategory;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;
  sortOrder: number;
  usageCount: number;
  createdAt: string;
}

interface TrendForm {
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  videoUrl: string;
  thumbnailUrl: string;
  referenceVideoUrl: string;
  model: string;
  promptTemplate: string;
  negativePrompt: string;
  duration: number;
  aspectRatio: string;
  tokenCost: number;
  categoryId: string;
  isFeatured: boolean;
  isNew: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface CategoryForm {
  slug: string;
  name: string;
  nameEn: string;
  icon: string;
  sortOrder: number;
}

const EMPTY_TREND: TrendForm = {
  name: '',
  nameEn: '',
  description: '',
  descriptionEn: '',
  videoUrl: '',
  thumbnailUrl: '',
  referenceVideoUrl: '',
  model: 'kling-motion',
  promptTemplate: '',
  negativePrompt: '',
  duration: 5,
  aspectRatio: '9:16',
  tokenCost: 0,
  categoryId: '',
  isFeatured: false,
  isNew: false,
  isActive: true,
  sortOrder: 0,
};

const EMPTY_CATEGORY: CategoryForm = {
  slug: '',
  name: '',
  nameEn: '',
  icon: '',
  sortOrder: 0,
};

const MODELS = ['kling-motion', 'kling-avatar'];
const DURATIONS = [5, 10];
const ASPECT_RATIOS = ['9:16', '16:9', '1:1'];

export default function Trends() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trend modal state
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [editingTrend, setEditingTrend] = useState<VideoTrend | null>(null);
  const [trendForm, setTrendForm] = useState<TrendForm>(EMPTY_TREND);
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'generation' | 'settings'>('basic');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Category state
  const [showCategorySection, setShowCategorySection] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TrendCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(EMPTY_CATEGORY);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Queries
  const { data: trendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['admin-trends'],
    queryFn: () => api.get('/trends').then((r) => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-trend-categories'],
    queryFn: () => api.get('/trends/categories').then((r) => r.data),
  });

  const trends: VideoTrend[] = trendsData?.trends || [];
  const categories: TrendCategory[] = categoriesData?.categories || [];

  // Trend mutations
  const createTrend = useMutation({
    mutationFn: (data: TrendForm) => api.post('/trends', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trends'] });
      addToast(t('trends.trendCreated'), 'success');
      closeTrendModal();
    },
    onError: (err: any) => addToast(err.response?.data?.error || 'Error', 'error'),
  });

  const updateTrend = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TrendForm }) => api.put(`/trends/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trends'] });
      addToast(t('trends.trendUpdated'), 'success');
      closeTrendModal();
    },
    onError: (err: any) => addToast(err.response?.data?.error || 'Error', 'error'),
  });

  const deleteTrend = useMutation({
    mutationFn: (id: string) => api.delete(`/trends/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trends'] });
      addToast(t('trends.trendDeleted'), 'success');
      setDeleteConfirm(null);
    },
    onError: (err: any) => addToast(err.response?.data?.error || 'Error', 'error'),
  });

  const toggleTrend = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/trends/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trends'] });
    },
    onError: (err: any) => addToast(err.response?.data?.error || 'Error', 'error'),
  });

  // Category mutations
  const createCategory = useMutation({
    mutationFn: (data: CategoryForm) => api.post('/trends/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trend-categories'] });
      addToast(t('trends.categoryCreated'), 'success');
      closeCategoryModal();
    },
    onError: (err: any) => addToast(err.response?.data?.error || 'Error', 'error'),
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryForm }) =>
      api.put(`/trends/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trend-categories'] });
      addToast(t('trends.categoryUpdated'), 'success');
      closeCategoryModal();
    },
    onError: (err: any) => addToast(err.response?.data?.error || 'Error', 'error'),
  });

  const seedCategories = useMutation({
    mutationFn: () => api.post('/trends/seed-categories'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trend-categories'] });
      addToast(t('trends.categoriesSeeded'), 'success');
    },
    onError: (err: any) => addToast(err.response?.data?.error || 'Error', 'error'),
  });

  // Video upload handler — works for both new and existing trends
  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const res = await api.post('/trends/upload-video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const videoUrl = res.data.videoUrl;
      // Set the URL in the form so it's saved with create/update
      setTrendForm((prev) => ({ ...prev, videoUrl }));
      if (editingTrend) {
        queryClient.invalidateQueries({ queryKey: ['admin-trends'] });
      }
      addToast(t('trends.videoUploaded'), 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Modal helpers
  const openCreateTrend = () => {
    setEditingTrend(null);
    setTrendForm(EMPTY_TREND);
    setActiveTab('basic');
    setShowTrendModal(true);
  };

  const openEditTrend = (trend: VideoTrend) => {
    setEditingTrend(trend);
    setTrendForm({
      name: trend.name,
      nameEn: trend.nameEn || '',
      description: trend.description || '',
      descriptionEn: trend.descriptionEn || '',
      videoUrl: trend.videoUrl || '',
      thumbnailUrl: trend.thumbnailUrl || '',
      referenceVideoUrl: trend.referenceVideoUrl || '',
      model: trend.model || 'kling-motion',
      promptTemplate: trend.promptTemplate || '',
      negativePrompt: trend.negativePrompt || '',
      duration: trend.duration || 5,
      aspectRatio: trend.aspectRatio || '9:16',
      tokenCost: trend.tokenCost || 0,
      categoryId: trend.categoryId || '',
      isFeatured: trend.isFeatured || false,
      isNew: trend.isNew || false,
      isActive: trend.isActive,
      sortOrder: trend.sortOrder || 0,
    });
    setActiveTab('basic');
    setShowTrendModal(true);
  };

  const closeTrendModal = () => {
    setShowTrendModal(false);
    setEditingTrend(null);
    setTrendForm(EMPTY_TREND);
  };

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY);
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: TrendCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      slug: cat.slug,
      name: cat.name,
      nameEn: cat.nameEn || '',
      icon: cat.icon || '',
      sortOrder: cat.sortOrder || 0,
    });
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY);
  };

  const handleTrendSubmit = () => {
    if (editingTrend) {
      updateTrend.mutate({ id: editingTrend.id, data: trendForm });
    } else {
      createTrend.mutate(trendForm);
    }
  };

  const handleCategorySubmit = () => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategory.mutate(categoryForm);
    }
  };

  const inputClasses = 'w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500';
  const labelClasses = 'block text-sm font-medium text-gray-400 mb-1.5';
  const tabClasses = (active: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('trends.title')}</h1>
        <button
          onClick={openCreateTrend}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus size={16} /> {t('trends.addTrend')}
        </button>
      </div>

      {/* Trends table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider w-20">
                  Video
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('trends.name')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('trends.category')}
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('trends.tokenCost')}
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('trends.usageCount')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('trends.status')}
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {t('trends.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {trendsLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : trends.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {t('trends.noTrends')}
                  </td>
                </tr>
              ) : (
                trends.map((trend) => (
                  <tr key={trend.id} className="hover:bg-gray-800/30">
                    {/* Video preview */}
                    <td className="px-4 py-3">
                      {trend.videoUrl ? (
                        <video
                          src={trend.videoUrl}
                          className="w-16 h-10 object-cover rounded-lg bg-gray-800"
                          muted
                          playsInline
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={(e) => {
                            const v = e.target as HTMLVideoElement;
                            v.pause();
                            v.currentTime = 0;
                          }}
                        />
                      ) : (
                        <div className="w-16 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                          <span className="text-gray-600 text-xs">---</span>
                        </div>
                      )}
                    </td>
                    {/* Name with badges */}
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{trend.name}</div>
                      <div className="flex gap-1.5 mt-1">
                        {trend.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-600/20 text-yellow-400">
                            <Star size={10} /> {t('trends.featured')}
                          </span>
                        )}
                        {trend.isNew && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-600/20 text-purple-400">
                            <Sparkles size={10} /> {t('trends.new')}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3 text-gray-400">
                      {trend.category ? (
                        <span className="inline-flex items-center gap-1.5">
                          {trend.category.icon && <span>{trend.category.icon}</span>}
                          {trend.category.name}
                        </span>
                      ) : (
                        <span className="text-gray-600">---</span>
                      )}
                    </td>
                    {/* Token cost */}
                    <td className="px-4 py-3 text-right text-white font-medium">
                      {trend.tokenCost}
                    </td>
                    {/* Usage */}
                    <td className="px-4 py-3 text-right text-gray-400">
                      {trend.usageCount || 0}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trend.isActive
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'bg-gray-600/20 text-gray-400'
                        }`}
                      >
                        {trend.isActive ? t('trends.active') : t('trends.inactive')}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openEditTrend(trend)}
                          className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded"
                          title={t('trends.editTrend')}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() =>
                            toggleTrend.mutate({ id: trend.id, isActive: !trend.isActive })
                          }
                          className={`p-1.5 rounded ${
                            trend.isActive
                              ? 'text-emerald-400 hover:bg-emerald-600/20'
                              : 'text-gray-500 hover:bg-gray-600/20'
                          }`}
                          title={trend.isActive ? t('trends.inactive') : t('trends.active')}
                        >
                          {trend.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: trend.id, name: trend.name })}
                          className="p-1.5 text-red-400 hover:bg-red-600/20 rounded"
                          title={t('common.delete')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Categories section */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <button
          onClick={() => setShowCategorySection(!showCategorySection)}
          className="w-full flex items-center justify-between px-6 py-4 text-white font-semibold hover:bg-gray-800/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Folder size={18} />
            {t('trends.categories')} ({categories.length})
          </span>
          {showCategorySection ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        {showCategorySection && (
          <div className="border-t border-gray-800">
            {/* Category actions */}
            <div className="px-6 py-3 flex gap-3">
              <button
                onClick={openCreateCategory}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                <Plus size={14} /> {t('trends.addCategory')}
              </button>
              <button
                onClick={() => seedCategories.mutate()}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                <Sprout size={14} /> {t('trends.seedCategories')}
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="px-6 py-6 text-center text-gray-500 text-sm">
                {t('trends.noCategories')}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('trends.icon')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('trends.slug')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('trends.name')}
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('trends.nameEn')}
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('trends.sortOrder')}
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {t('trends.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-3 text-lg">{cat.icon || '---'}</td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.slug}</td>
                      <td className="px-4 py-3 text-white">{cat.name}</td>
                      <td className="px-4 py-3 text-gray-400">{cat.nameEn || '---'}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{cat.sortOrder}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => openEditCategory(cat)}
                          className="p-1.5 text-blue-400 hover:bg-blue-600/20 rounded"
                          title={t('trends.editTrend')}
                        >
                          <Pencil size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Trend Create/Edit Modal */}
      {showTrendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeTrendModal} />
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 rounded-t-2xl z-10">
              <h3 className="text-lg font-semibold text-white">
                {editingTrend ? t('trends.editTrend') : t('trends.newTrend')}
              </h3>
            </div>

            <div className="p-6">
              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-gray-800/50 rounded-lg p-1">
                <button className={tabClasses(activeTab === 'basic')} onClick={() => setActiveTab('basic')}>
                  {t('trends.basicInfo')}
                </button>
                <button className={tabClasses(activeTab === 'media')} onClick={() => setActiveTab('media')}>
                  {t('trends.mediaSettings')}
                </button>
                <button className={tabClasses(activeTab === 'generation')} onClick={() => setActiveTab('generation')}>
                  {t('trends.generationSettings')}
                </button>
                <button className={tabClasses(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>
                  {t('trends.displaySettings')}
                </button>
              </div>

              {/* Basic Info tab */}
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>{t('trends.name')}</label>
                    <input
                      type="text"
                      value={trendForm.name}
                      onChange={(e) => setTrendForm({ ...trendForm, name: e.target.value })}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>{t('trends.nameEn')}</label>
                    <input
                      type="text"
                      value={trendForm.nameEn}
                      onChange={(e) => setTrendForm({ ...trendForm, nameEn: e.target.value })}
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>{t('trends.description')}</label>
                    <textarea
                      value={trendForm.description}
                      onChange={(e) => setTrendForm({ ...trendForm, description: e.target.value })}
                      className={`${inputClasses} h-20 resize-none`}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>{t('trends.descriptionEn')}</label>
                    <textarea
                      value={trendForm.descriptionEn}
                      onChange={(e) => setTrendForm({ ...trendForm, descriptionEn: e.target.value })}
                      className={`${inputClasses} h-20 resize-none`}
                    />
                  </div>
                </div>
              )}

              {/* Media tab */}
              {activeTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>{t('trends.videoUrl')}</label>
                    <input
                      type="text"
                      value={trendForm.videoUrl}
                      onChange={(e) => setTrendForm({ ...trendForm, videoUrl: e.target.value })}
                      className={inputClasses}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>{t('trends.thumbnailUrl')}</label>
                    <input
                      type="text"
                      value={trendForm.thumbnailUrl}
                      onChange={(e) => setTrendForm({ ...trendForm, thumbnailUrl: e.target.value })}
                      className={inputClasses}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>{t('trends.referenceVideoUrl')}</label>
                    <input
                      type="text"
                      value={trendForm.referenceVideoUrl}
                      onChange={(e) => setTrendForm({ ...trendForm, referenceVideoUrl: e.target.value })}
                      className={inputClasses}
                      placeholder="https://..."
                    />
                  </div>
                  {/* Video upload */}
                  <div>
                    <label className={labelClasses}>{t('trends.uploadVideo')}</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleVideoUpload(file);
                        }
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingVideo}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors border border-gray-700 disabled:opacity-50"
                    >
                      <Upload size={16} />
                      {uploadingVideo ? t('common.loading') : t('trends.uploadVideo')}
                    </button>
                  </div>
                  {/* Preview */}
                  {trendForm.videoUrl && (
                    <div>
                      <label className={labelClasses}>Preview</label>
                      <video
                        src={trendForm.videoUrl}
                        className="w-full max-w-xs rounded-xl bg-gray-800"
                        controls
                        muted
                        playsInline
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Generation Settings tab */}
              {activeTab === 'generation' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>{t('trends.model')}</label>
                    <select
                      value={trendForm.model}
                      onChange={(e) => setTrendForm({ ...trendForm, model: e.target.value })}
                      className={inputClasses}
                    >
                      {MODELS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>{t('trends.promptTemplate')}</label>
                    <textarea
                      value={trendForm.promptTemplate}
                      onChange={(e) => setTrendForm({ ...trendForm, promptTemplate: e.target.value })}
                      className={`${inputClasses} h-28 resize-none font-mono text-xs`}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>{t('trends.negativePrompt')}</label>
                    <textarea
                      value={trendForm.negativePrompt}
                      onChange={(e) => setTrendForm({ ...trendForm, negativePrompt: e.target.value })}
                      className={`${inputClasses} h-20 resize-none font-mono text-xs`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>{t('trends.duration')}</label>
                      <select
                        value={trendForm.duration}
                        onChange={(e) => setTrendForm({ ...trendForm, duration: Number(e.target.value) })}
                        className={inputClasses}
                      >
                        {DURATIONS.map((d) => (
                          <option key={d} value={d}>
                            {d}s
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClasses}>{t('trends.aspectRatio')}</label>
                      <select
                        value={trendForm.aspectRatio}
                        onChange={(e) => setTrendForm({ ...trendForm, aspectRatio: e.target.value })}
                        className={inputClasses}
                      >
                        {ASPECT_RATIOS.map((ar) => (
                          <option key={ar} value={ar}>
                            {ar}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Display Settings tab */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>{t('trends.tokenCost')}</label>
                    <input
                      type="number"
                      value={trendForm.tokenCost}
                      onChange={(e) => setTrendForm({ ...trendForm, tokenCost: Number(e.target.value) })}
                      className={inputClasses}
                      min={0}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>{t('trends.category')}</label>
                    <select
                      value={trendForm.categoryId}
                      onChange={(e) => setTrendForm({ ...trendForm, categoryId: e.target.value })}
                      className={inputClasses}
                    >
                      <option value="">---</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>{t('trends.sortOrder')}</label>
                    <input
                      type="number"
                      value={trendForm.sortOrder}
                      onChange={(e) => setTrendForm({ ...trendForm, sortOrder: Number(e.target.value) })}
                      className={inputClasses}
                    />
                  </div>
                  {/* Toggle switches */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-300">{t('trends.active')}</span>
                      <button
                        type="button"
                        onClick={() => setTrendForm({ ...trendForm, isActive: !trendForm.isActive })}
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          trendForm.isActive ? 'bg-emerald-600' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            trendForm.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-300">{t('trends.featured')}</span>
                      <button
                        type="button"
                        onClick={() => setTrendForm({ ...trendForm, isFeatured: !trendForm.isFeatured })}
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          trendForm.isFeatured ? 'bg-yellow-600' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            trendForm.isFeatured ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-gray-300">{t('trends.new')}</span>
                      <button
                        type="button"
                        onClick={() => setTrendForm({ ...trendForm, isNew: !trendForm.isNew })}
                        className={`w-11 h-6 rounded-full transition-colors relative ${
                          trendForm.isNew ? 'bg-purple-600' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                            trendForm.isNew ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-800 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={closeTrendModal}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleTrendSubmit}
                disabled={createTrend.isPending || updateTrend.isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Create/Edit Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeCategoryModal} />
          <div className="relative bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingCategory ? t('trends.categories') : t('trends.addCategory')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelClasses}>{t('trends.slug')}</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  className={inputClasses}
                  placeholder="e.g. dance"
                />
              </div>
              <div>
                <label className={labelClasses}>{t('trends.name')}</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className={labelClasses}>{t('trends.nameEn')}</label>
                <input
                  type="text"
                  value={categoryForm.nameEn}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>{t('trends.icon')}</label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className={inputClasses}
                    placeholder="e.g. emoji"
                  />
                </div>
                <div>
                  <label className={labelClasses}>{t('trends.sortOrder')}</label>
                  <input
                    type="number"
                    value={categoryForm.sortOrder}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: Number(e.target.value) })}
                    className={inputClasses}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeCategoryModal}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCategorySubmit}
                disabled={createCategory.isPending || updateCategory.isPending}
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title={t('trends.deleteTrend')}
        message={t('trends.deleteConfirm')}
        confirmLabel={t('common.delete')}
        danger
        onConfirm={() => {
          if (deleteConfirm) deleteTrend.mutate(deleteConfirm.id);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
