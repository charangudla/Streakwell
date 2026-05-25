/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Folder } from 'lucide-react';
import { getCategories, createCategory, updateCategory, toggleCategoryActive } from '../api/service';
import { validateCategoryForm } from '../validation/adminForms';
import type { Category } from '../api/mockData';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    catId: string;
    catName: string;
    actionType: 'toggle-active';
  }>({
    isOpen: false,
    catId: '',
    catName: '',
    actionType: 'toggle-active',
  });

  const loadCategories = () => {
    setIsLoading(true);
    getCategories()
      .then((data) => {
        setCategories(data);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load categories', err);
        setError('Unable to load categories. Please check server connections.');
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description ?? '');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    // Auto-generate basic slug from name if not editing
    if (!editingCategory) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const validation = validateCategoryForm({ name });
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    // Slug validation
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slug.trim()) {
      setFormErrors({ slug: 'Slug is required' });
      return;
    } else if (!slugRegex.test(slug)) {
      setFormErrors({ slug: 'Slug must only contain lowercase alphanumeric characters and hyphens' });
      return;
    }

    setFormErrors({});

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
        });
      } else {
        await createCategory({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim(),
          isActive: true,
        });
      }
      setIsFormOpen(false);
      loadCategories();
    } catch (err: any) {
      setFormErrors({ form: err.message ?? 'An error occurred while saving.' });
    }
  };

  const handleOpenConfirmToggle = (cat: Category) => {
    setConfirmModal({
      isOpen: true,
      catId: cat.id,
      catName: cat.name,
      actionType: 'toggle-active',
    });
  };

  const handleConfirmAction = async () => {
    try {
      if (confirmModal.actionType === 'toggle-active') {
        await toggleCategoryActive(confirmModal.catId);
      }
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      loadCategories();
    } catch (err) {
      console.error('Failed to execute confirm action', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Retrieving challenge categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Challenge Categories"
        description="Configure and manage the focal categories for your 30-day health wellness challenges."
        action={
          <button
            onClick={handleOpenCreate}
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition"
          >
            <Plus size={18} aria-hidden="true" />
            New Category
          </button>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Grid List */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Folder size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No categories found</h3>
          <p className="mt-1 text-sm text-slate-500">Click the button above to seed your first wellness category.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md ${
                cat.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <h3 className={`text-lg font-extrabold ${cat.isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {cat.name}
                  </h3>
                  <StatusBadge value={cat.isActive ? 'ACTIVE' : 'ABANDONED'} />
                </div>
                <p className="mt-1.5 font-mono text-xs font-semibold text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded">
                  /{cat.slug}
                </p>
                <p className={`mt-4 text-sm leading-relaxed ${cat.isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  onClick={() => handleOpenConfirmToggle(cat)}
                  type="button"
                  className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition ${
                    cat.isActive
                      ? 'text-slate-400 hover:text-slate-700'
                      : 'text-emerald-600 hover:text-emerald-800'
                  }`}
                >
                  {cat.isActive ? (
                    <>
                      <ToggleRight size={20} className="text-emerald-500" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={20} className="text-slate-300" />
                      Activate
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleOpenEdit(cat)}
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Create/Edit Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-extrabold text-slate-950">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Configure parameters ensuring slugs remain clean.</p>

            {formErrors.form && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-100 p-3 text-sm text-rose-800 font-semibold">
                {formErrors.form}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-6 space-y-4" noValidate>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="name">
                  Category Name
                </label>
                <input
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition focus:ring-4 focus:ring-emerald-500/10 ${
                    formErrors.name ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-emerald-600'
                  }`}
                  id="name"
                  type="text"
                  placeholder="e.g. Mental Wellness"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
                {formErrors.name && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.name}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="slug">
                  Slug
                </label>
                <input
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition focus:ring-4 focus:ring-emerald-500/10 ${
                    formErrors.slug ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-emerald-600'
                  }`}
                  id="slug"
                  type="text"
                  placeholder="e.g. mental-wellness"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
                {formErrors.slug && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.slug}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10"
                  id="description"
                  placeholder="Summarize the core focus of this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsFormOpen(false)}
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm shadow-emerald-100 hover:bg-emerald-700 transition"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.catName}
        message={`Are you sure you want to toggle the active status of category "${confirmModal.catName}"? This will shift its visibility across challenges.`}
        confirmText="Confirm Status Switch"
        isDanger={false}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
