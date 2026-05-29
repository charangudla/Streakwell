/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Folder, Trophy } from 'lucide-react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/service';
import { validateCategoryForm } from '../validation/adminForms';
import type { Category } from '../api/mockData';
import { PageHeader } from '../components/PageHeader';
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

  // Delete confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    catId: string;
    catName: string;
  }>({
    isOpen: false,
    catId: '',
    catName: '',
  });
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        });
      }
      setIsFormOpen(false);
      loadCategories();
    } catch (err: any) {
      setFormErrors({ form: err.message ?? 'An error occurred while saving.' });
    }
  };

  const handleOpenConfirmDelete = (cat: Category) => {
    setDeleteError(null);
    setConfirmModal({
      isOpen: true,
      catId: cat.id,
      catName: cat.name,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      const result = await deleteCategory(confirmModal.catId);
      // The mock fallback always "succeeds"; a real 400 (category still has
      // challenges) is surfaced from the thrown axios error below.
      if (!('deleted' in result) || !result.deleted) {
        throw new Error('Category could not be deleted.');
      }
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      setDeleteError(null);
      loadCategories();
    } catch (err: unknown) {
      // Axios errors carry the API message under response.data.message.
      const anyErr = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const apiMessage = anyErr.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage[0]
        : (apiMessage ?? anyErr.message ?? 'Failed to delete category.');
      setDeleteError(message);
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

      {deleteError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {deleteError}
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
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900">{cat.name}</h3>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-slate-500">
                    <Trophy size={12} className="text-amber-500" />
                    {cat.challengeCount} {cat.challengeCount === 1 ? 'challenge' : 'challenges'}
                  </span>
                </div>
                <p className="mt-1.5 font-mono text-xs font-semibold text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded">
                  /{cat.slug}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  onClick={() => handleOpenConfirmDelete(cat)}
                  type="button"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-700 transition disabled:opacity-40"
                  disabled={cat.challengeCount > 0}
                  title={cat.challengeCount > 0 ? 'Reassign or remove its challenges first' : 'Delete category'}
                >
                  <Trash2 size={15} />
                  Delete
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`Delete "${confirmModal.catName}"`}
        message={`Are you sure you want to permanently delete category "${confirmModal.catName}"? This cannot be undone. Categories that still have challenges cannot be deleted.`}
        confirmText="Delete Category"
        isDanger
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
