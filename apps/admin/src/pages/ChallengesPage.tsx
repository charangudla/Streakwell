/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Plus, Edit2, Search, ToggleLeft, ToggleRight, Star, Eye, BookOpen, X } from 'lucide-react';
import {
  getChallenges,
  getCategories,
  createChallenge,
  updateChallenge,
  toggleChallengeActive,
  toggleChallengePopular,
  toggleChallengeRecommended,
} from '../api/service';
import { validateChallengeForm } from '../validation/adminForms';
import type { Challenge, Category } from '../api/mockData';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmModal } from '../components/ConfirmModal';

export function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [dailyTask, setDailyTask] = useState('');
  const [safetyNote, setSafetyNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirmation Modals State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    chalId: string;
    chalTitle: string;
    actionType: 'toggle-active' | 'toggle-popular' | 'toggle-recommended';
  }>({
    isOpen: false,
    chalId: '',
    chalTitle: '',
    actionType: 'toggle-active',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [chals, cats] = await Promise.all([getChallenges(), getCategories()]);
      setChallenges(chals);
      setCategories(cats);
      setError(null);
    } catch (err) {
      console.error('Failed to load challenges data', err);
      setError('Unable to load challenges. Please verify backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingChallenge(null);
    setTitle('');
    setSlug('');
    setShortDescription('');
    setDescription('');
    setDurationDays(30);
    setDifficulty('MEDIUM');
    setDailyTask('');
    setSafetyNote('');
    setCategoryId(categories[0]?.id ?? '');
    setBenefits([]);
    setBenefitInput('');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEdit = (chal: Challenge) => {
    setEditingChallenge(chal);
    setTitle(chal.title);
    setSlug(chal.slug);
    setShortDescription(chal.shortDescription);
    setDescription(chal.description);
    setDurationDays(chal.durationDays);
    setDifficulty(chal.difficulty);
    setDailyTask(chal.dailyTask);
    setSafetyNote(chal.safetyNote ?? '');
    setCategoryId(chal.categoryId);
    setBenefits(chal.benefits || []);
    setBenefitInput('');
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingChallenge) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
      );
    }
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim() && !benefits.includes(benefitInput.trim())) {
      setBenefits([...benefits, benefitInput.trim()]);
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (index: number) => {
    setBenefits(benefits.filter((_, idx) => idx !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate using validateChallengeForm
    const validation = validateChallengeForm({
      title,
      description,
      durationDays: Number(durationDays),
    });

    const errors: Record<string, string> = { ...validation.errors };

    // Custom validations
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slug.trim()) {
      errors.slug = 'Slug is required';
    } else if (!slugRegex.test(slug)) {
      errors.slug = 'Slug must only contain lowercase alphanumeric characters and hyphens';
    }

    if (!shortDescription.trim()) {
      errors.shortDescription = 'Short description is required';
    }

    if (!dailyTask.trim()) {
      errors.dailyTask = 'Daily task prompt is required';
    }

    if (!categoryId) {
      errors.categoryId = 'Assigning a category is required';
    }

    if (benefits.length === 0) {
      errors.benefits = 'Please add at least one benefit point';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      durationDays: Number(durationDays),
      difficulty,
      dailyTask: dailyTask.trim(),
      benefits,
      safetyNote: safetyNote.trim() || undefined,
      categoryId,
      isPopular: editingChallenge ? editingChallenge.isPopular : false,
      isRecommended: editingChallenge ? editingChallenge.isRecommended : false,
      isActive: editingChallenge ? editingChallenge.isActive : true,
    };

    try {
      if (editingChallenge) {
        await updateChallenge(editingChallenge.id, payload);
      } else {
        await createChallenge(payload);
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      setFormErrors({ form: err.message ?? 'Failed to save challenge.' });
    }
  };

  const handleOpenConfirm = (
    chal: Challenge,
    actionType: 'toggle-active' | 'toggle-popular' | 'toggle-recommended'
  ) => {
    setConfirmModal({
      isOpen: true,
      chalId: chal.id,
      chalTitle: chal.title,
      actionType,
    });
  };

  const handleConfirmAction = async () => {
    try {
      const { actionType, chalId } = confirmModal;
      if (actionType === 'toggle-active') {
        await toggleChallengeActive(chalId);
      } else if (actionType === 'toggle-popular') {
        await toggleChallengePopular(chalId);
      } else if (actionType === 'toggle-recommended') {
        await toggleChallengeRecommended(chalId);
      }
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      loadData();
    } catch (err) {
      console.error('Failed to execute confirm actions on challenge', err);
    }
  };

  // Filter Challenges
  const filteredChallenges = challenges.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.shortDescription.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter ? c.difficulty === difficultyFilter : true;
    const matchesCategory = categoryFilter ? c.categoryId === categoryFilter : true;
    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        <p className="text-sm font-medium text-slate-500">Retrieving challenges database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Starter Challenges"
        description="Establish and modify structured 30-day challenges to drive user habits."
        action={
          <button
            onClick={handleOpenCreate}
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 font-semibold text-white shadow-sm shadow-emerald-200 hover:bg-emerald-700 transition"
          >
            <Plus size={18} aria-hidden="true" />
            New Challenge
          </button>
        }
      />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Filters Dashboard */}
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white"
            placeholder="Search by title, slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="BEGINNER">Beginner</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <div>
          <select
            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-600 focus:bg-white"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* List Table */}
      {filteredChallenges.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <BookOpen size={28} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900">No challenges matched</h3>
          <p className="mt-1 text-sm text-slate-500">Try modifying filters or add a new challenge starter.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="p-4">Title & Slug</th>
                <th className="p-4">Category</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-center">Promotions</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredChallenges.map((chal) => {
                const cat = categories.find((c) => c.id === chal.categoryId);
                return (
                  <tr key={chal.id} className={`hover:bg-slate-50 transition-colors ${chal.isActive ? '' : 'bg-slate-50/20 text-slate-400'}`}>
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{chal.title}</p>
                      <p className="font-mono text-2xs text-slate-400">/{chal.slug}</p>
                    </td>
                    <td className="p-4 font-semibold text-slate-600">{cat?.name ?? 'Unknown'}</td>
                    <td className="p-4">
                      <StatusBadge value={chal.difficulty} />
                    </td>
                    <td className="p-4 font-semibold text-slate-500">{chal.durationDays} Days</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenConfirm(chal, 'toggle-popular')}
                          type="button"
                          title="Toggle Popular Highlight"
                          className={`p-1.5 rounded-lg border transition ${
                            chal.isPopular
                              ? 'border-amber-200 bg-amber-50 text-amber-500'
                              : 'border-slate-200 text-slate-300 hover:text-slate-500'
                          }`}
                        >
                          <Star size={16} fill={chal.isPopular ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => handleOpenConfirm(chal, 'toggle-recommended')}
                          type="button"
                          title="Toggle Recommended Highlight"
                          className={`p-1.5 rounded-lg border transition ${
                            chal.isRecommended
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-500'
                              : 'border-slate-200 text-slate-300 hover:text-slate-500'
                          }`}
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleOpenConfirm(chal, 'toggle-active')}
                          type="button"
                          className="inline-flex items-center"
                        >
                          {chal.isActive ? (
                            <ToggleRight size={22} className="text-emerald-500 hover:text-emerald-600 transition" />
                          ) : (
                            <ToggleLeft size={22} className="text-slate-300 hover:text-slate-400 transition" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(chal)}
                          type="button"
                          className="p-1 rounded text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-extrabold text-slate-950">
              {editingChallenge ? 'Edit Challenge' : 'Create Challenge'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Provide parameters strictly adhering to validation constraints.</p>

            {formErrors.form && (
              <div className="mt-4 rounded-lg bg-rose-50 border border-rose-100 p-3 text-sm text-rose-800 font-semibold">
                {formErrors.form}
              </div>
            )}

            <form onSubmit={handleSave} className="mt-6 space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="title">
                    Title
                  </label>
                  <input
                    className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition focus:ring-4 focus:ring-emerald-500/10 ${
                      formErrors.title ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-emerald-600'
                    }`}
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                  {formErrors.title && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.title}</p>}
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
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                  {formErrors.slug && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.slug}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="shortDescription">
                  Short Description
                </label>
                <input
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition focus:ring-4 focus:ring-emerald-500/10 ${
                    formErrors.shortDescription ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-emerald-600'
                  }`}
                  id="shortDescription"
                  type="text"
                  placeholder="Summary matching challenge list card look"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                />
                {formErrors.shortDescription && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.shortDescription}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="description">
                  Full Detailed Description
                </label>
                <textarea
                  className={`h-20 w-full rounded-lg border bg-white p-3 text-sm text-slate-950 outline-none transition focus:ring-4 focus:ring-emerald-500/10 ${
                    formErrors.description ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-emerald-600'
                  }`}
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {formErrors.description && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.description}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="durationDays">
                    Duration (Days)
                  </label>
                  <input
                    className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition focus:ring-4 focus:ring-emerald-500/10 ${
                      formErrors.durationDays ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-emerald-600'
                    }`}
                    id="durationDays"
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                  />
                  {formErrors.durationDays && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.durationDays}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="difficulty">
                    Difficulty
                  </label>
                  <select
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600"
                    id="difficulty"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="categoryId">
                    Category
                  </label>
                  <select
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600"
                    id="categoryId"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.categoryId && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.categoryId}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="dailyTask">
                  Daily Check-in Task Prompt
                </label>
                <input
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 outline-none transition focus:ring-4 focus:ring-emerald-500/10 ${
                    formErrors.dailyTask ? 'border-rose-400 focus:border-rose-600' : 'border-slate-300 focus:border-emerald-600'
                  }`}
                  id="dailyTask"
                  type="text"
                  placeholder="e.g. Log at least 10,000 steps today."
                  value={dailyTask}
                  onChange={(e) => setDailyTask(e.target.value)}
                />
                {formErrors.dailyTask && <p className="mt-1 text-xs font-semibold text-rose-600">{formErrors.dailyTask}</p>}
              </div>

              {/* Benefits Json tags Array input */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="benefitInput">
                  Benefits / Outcome tags
                </label>
                <div className="flex gap-2">
                  <input
                    className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600"
                    id="benefitInput"
                    type="text"
                    placeholder="e.g. Higher metabolism"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddBenefit}
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800 transition"
                  >
                    Add
                  </button>
                </div>
                {formErrors.benefits && <p className="mt-1.5 text-xs font-semibold text-rose-600">{formErrors.benefits}</p>}

                {benefits.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                    {benefits.map((benefit, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white pl-2.5 pr-1.5 py-1 text-xs font-semibold text-slate-600">
                        {benefit}
                        <button
                          type="button"
                          onClick={() => handleRemoveBenefit(idx)}
                          className="grid h-4 w-4 place-items-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="safetyNote">
                  Safety Note / Precaution (Optional)
                </label>
                <input
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-emerald-600"
                  id="safetyNote"
                  type="text"
                  placeholder="e.g. Consult cardiac specialists if diagnosed with arrhythmias."
                  value={safetyNote}
                  onChange={(e) => setSafetyNote(e.target.value)}
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
                  Save Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.chalTitle}
        message={`Are you sure you want to perform this update on "${confirmModal.chalTitle}"? This will modify how users interact with this challenge.`}
        confirmText="Yes, Execute Change"
        isDanger={confirmModal.actionType === 'toggle-active'}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
