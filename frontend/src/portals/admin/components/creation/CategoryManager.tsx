import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderPlus,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ListTree,
  Table as TableIcon,
  CornerDownRight,
  FolderTree,
  PlusCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminCatalogApi, type CategoryItem } from '../../api/adminCatalog.api';
import { DynamicMetaKeyValueBuilder, type KeyValuePair } from './DynamicMetaKeyValueBuilder';
import { AdminPagination } from '../AdminPagination';

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // View Mode: 'tree' (Hierarchy Tree View) or 'table' (All Entries Flat Table View)
  const [viewMode, setViewMode] = useState<'tree' | 'table'>('tree');
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<number>>(new Set());

  // Pagination states for table view
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState<string>('');
  const [parent, setParent] = useState<number | ''>('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [status, setStatus] = useState<'active' | 'hidden'>('active');
  const [seoTitle, setSeoTitle] = useState<string>('');
  const [seoDescription, setSeoDescription] = useState<string>('');
  const [metaPairs, setMetaPairs] = useState<KeyValuePair[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await adminCatalogApi.getCategoriesDetailed();
      setCategories(data);
      // Auto expand all top level parents initially
      const parentIds = data.filter((c) => !c.parent).map((c) => c.id);
      setExpandedCategoryIds(new Set(parentIds));
    } catch {
      toast.error('Failed to load categories from API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (id: number) => {
    setExpandedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allParentIds = categories.filter((c) => !c.parent).map((c) => c.id);
    setExpandedCategoryIds(new Set(allParentIds));
  };

  const collapseAll = () => {
    setExpandedCategoryIds(new Set());
  };

  const openCreateModal = (defaultParentId?: number) => {
    setEditingCategory(null);
    setName('');
    setParent(defaultParentId !== undefined ? defaultParentId : '');
    setSortOrder(0);
    setStatus('active');
    setSeoTitle('');
    setSeoDescription('');
    setMetaPairs([
      { id: '1', key: 'show_on_homepage', value: 'true' },
      { id: '2', key: 'banner_subtitle', value: 'High quality medicines' },
    ]);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setName(cat.name);
    setParent(cat.parent || '');
    setSortOrder(cat.sort_order || 0);
    setStatus((cat.status as 'active' | 'hidden') || 'active');

    const meta = cat.metadata || {};
    setSeoTitle(meta.seo_title || '');
    setSeoDescription(meta.seo_description || '');

    const pairs: KeyValuePair[] = [];
    Object.entries(meta).forEach(([k, v]) => {
      if (k !== 'seo_title' && k !== 'seo_description') {
        pairs.push({
          id: Math.random().toString(36).substr(2, 9),
          key: k,
          value: typeof v === 'object' ? JSON.stringify(v) : String(v),
        });
      }
    });
    setMetaPairs(pairs);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const metadata: Record<string, any> = {
        show_on_homepage: true,
        seo_title: seoTitle || name,
        seo_description: seoDescription,
      };

      metaPairs.forEach((p) => {
        if (p.key.trim()) {
          metadata[p.key.trim()] = p.value.trim();
        }
      });

      const payload = {
        name,
        parent: parent === '' ? null : Number(parent),
        sort_order: sortOrder,
        status,
        metadata,
      };

      if (editingCategory) {
        await adminCatalogApi.updateCategory(editingCategory.id, payload);
        toast.success(`Category "${name}" updated successfully!`);
      } else {
        await adminCatalogApi.createCategory(payload);
        toast.success(`Category "${name}" created successfully!`);
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch {
      toast.error('Failed to save category via API');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminCatalogApi.deleteCategory(id);
      toast.success('Category deleted successfully!');
      setDeleteConfirmId(null);
      fetchCategories();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  // Filter logic across all items
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.slug && c.slug.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [categories, searchQuery, statusFilter]);

  // Hierarchical tree structure grouping
  const categoryTree = useMemo(() => {
    const parentMap = new Map<number, CategoryItem>();
    const topLevelParents: CategoryItem[] = [];
    const childrenMap = new Map<number, CategoryItem[]>();

    // Map all items by ID
    categories.forEach((c) => {
      parentMap.set(c.id, c);
      if (!c.parent) {
        topLevelParents.push(c);
      } else {
        const list = childrenMap.get(c.parent) || [];
        list.push(c);
        childrenMap.set(c.parent, list);
      }
    });

    // Also handle top-level children from `children` array property if API returns nested
    categories.forEach((c) => {
      if (c.children && c.children.length > 0) {
        const existing = childrenMap.get(c.id) || [];
        const existingIds = new Set(existing.map((child) => child.id));
        c.children.forEach((child) => {
          if (!existingIds.has(child.id)) {
            existing.push(child);
          }
        });
        childrenMap.set(c.id, existing);
      }
    });

    return { topLevelParents, childrenMap };
  }, [categories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-bg-card border border-bg-border shadow-card">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-primary-500/15 text-primary-400 border border-primary-500/30">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-head font-bold text-xl text-content-primary">
              Category & Hierarchy Management
            </h2>
            <p className="text-xs text-content-muted">
              Total {categories.length} categories in database (Parents & Sub-categories)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border transition-colors"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Category</span>
          </button>
        </div>
      </div>

      {/* Search, Filter, and View Mode Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-content-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parent or sub-categories..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-content-muted hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs font-medium outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active Only</option>
              <option value="hidden">Hidden Only</option>
            </select>
          </div>
        </div>

        {/* View Switcher: Tree vs Table */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          {viewMode === 'tree' && (
            <div className="flex items-center space-x-1.5 mr-2">
              <button
                onClick={expandAll}
                className="px-2.5 py-1 rounded-lg bg-bg-card border border-bg-border hover:bg-bg-hover text-[11px] font-mono text-content-muted"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-2.5 py-1 rounded-lg bg-bg-card border border-bg-border hover:bg-bg-hover text-[11px] font-mono text-content-muted"
              >
                Collapse All
              </button>
            </div>
          )}

          <div className="p-1 bg-bg-surface border border-bg-border rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'tree'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>Category Tree</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'table'
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>All Entries Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="rounded-3xl bg-bg-card border border-bg-border overflow-hidden shadow-card p-4 sm:p-6">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary-400 mx-auto" />
            <p className="text-xs text-content-muted">Loading category database entries from DRF API...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FolderPlus className="w-10 h-10 text-content-muted mx-auto opacity-40" />
            <p className="text-sm font-bold text-content-secondary">No Categories Found</p>
            <p className="text-xs text-content-muted">Try adjusting search or click &quot;Create New Category&quot;</p>
          </div>
        ) : viewMode === 'tree' ? (
          /* HIERARCHY TREE VIEW */
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-bg-border text-xs font-mono text-content-muted">
              <span>CATEGORY TREE STRUCTURE</span>
              <span>{categoryTree.topLevelParents.length} Top-Level Parent Categories</span>
            </div>

            {categoryTree.topLevelParents
              .filter((parentCat) => {
                if (searchQuery.trim() === '') return true;
                const matchesParent = parentCat.name.toLowerCase().includes(searchQuery.toLowerCase());
                const children = categoryTree.childrenMap.get(parentCat.id) || [];
                const matchesChild = children.some((c) =>
                  c.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                return matchesParent || matchesChild;
              })
              .map((parentCat) => {
                const subCats = categoryTree.childrenMap.get(parentCat.id) || [];
                const isExpanded = expandedCategoryIds.has(parentCat.id);

                return (
                  <div
                    key={parentCat.id}
                    className="rounded-2xl border border-bg-border bg-bg-surface/50 overflow-hidden transition-all"
                  >
                    {/* Parent Header Row */}
                    <div className="p-4 bg-bg-card hover:bg-bg-hover/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-bg-border/60">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleExpand(parentCat.id)}
                          className="p-1.5 rounded-lg bg-bg-surface hover:bg-bg-hover text-content-secondary border border-bg-border transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-primary-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-content-muted" />
                          )}
                        </button>

                        <div className="p-2 rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/30">
                          <FolderTree className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-head font-bold text-content-primary text-base">
                              {parentCat.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary-500/15 text-primary-400 border border-primary-500/30">
                              Parent ID #{parentCat.id}
                            </span>
                            {subCats.length > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                {subCats.length} Sub-categories
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-content-muted bg-bg-surface border border-bg-border">
                                0 Sub-categories
                              </span>
                            )}
                          </div>
                          {parentCat.slug && (
                            <span className="text-[11px] font-mono text-content-muted">
                              Slug: {parentCat.slug}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Parent Actions */}
                      <div className="flex items-center space-x-2 self-end sm:self-auto">
                        <button
                          onClick={() => openCreateModal(parentCat.id)}
                          className="px-3 py-1.5 rounded-lg bg-primary-500/15 hover:bg-primary-500/25 text-primary-400 border border-primary-500/30 text-xs font-bold transition-all flex items-center space-x-1.5"
                          title="Add Sub-category under this parent"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>+ Add Sub-category</span>
                        </button>
                        <button
                          onClick={() => openEditModal(parentCat)}
                          className="p-1.5 rounded-lg bg-bg-surface hover:bg-primary-500/20 text-primary-400 border border-bg-border transition-colors"
                          title="Edit Parent Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(parentCat.id)}
                          className="p-1.5 rounded-lg bg-bg-surface hover:bg-rose-500/20 text-rose-400 border border-bg-border transition-colors"
                          title="Delete Parent Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-categories Tree Branch */}
                    {isExpanded && (
                      <div className="p-3 sm:p-4 space-y-2 bg-bg-surface/30">
                        {subCats.length === 0 ? (
                          <div className="p-4 text-center border border-dashed border-bg-border rounded-xl text-xs text-content-muted">
                            No sub-categories created under &quot;{parentCat.name}&quot; yet.{' '}
                            <button
                              onClick={() => openCreateModal(parentCat.id)}
                              className="text-primary-400 font-bold hover:underline"
                            >
                              Click here to create one
                            </button>
                          </div>
                        ) : (
                          subCats
                            .filter((sub) => {
                              if (searchQuery.trim() === '') return true;
                              return (
                                sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                parentCat.name.toLowerCase().includes(searchQuery.toLowerCase())
                              );
                            })
                            .map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-bg-card border border-bg-border hover:border-primary-500/40 transition-all pl-4 sm:pl-6"
                              >
                                <div className="flex items-center space-x-3">
                                  <CornerDownRight className="w-4 h-4 text-amber-400 shrink-0" />
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-head font-bold text-content-primary text-sm">
                                        {sub.name}
                                      </span>
                                      <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold">
                                        Sub ID #{sub.id}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                                          sub.status === 'active'
                                            ? 'bg-emerald-500/15 text-emerald-400'
                                            : 'bg-bg-surface text-content-muted'
                                        }`}
                                      >
                                        {sub.status}
                                      </span>
                                    </div>
                                    {sub.slug && (
                                      <span className="text-[10px] font-mono text-content-muted">
                                        {sub.slug}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => openEditModal(sub)}
                                    className="p-1.5 rounded-lg bg-bg-surface hover:bg-primary-500/20 text-primary-400 border border-bg-border transition-colors"
                                    title="Edit Sub-category"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(sub.id)}
                                    className="p-1.5 rounded-lg bg-bg-surface hover:bg-rose-500/20 text-rose-400 border border-bg-border transition-colors"
                                    title="Delete Sub-category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        ) : (
          /* FLAT TABLE VIEW (SHOWING ALL ENTRIES IN DATABASE) */
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-content-secondary">
                <thead className="bg-bg-surface text-content-muted font-mono uppercase text-[10px] border-b border-bg-border">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">ID</th>
                    <th className="py-3.5 px-4 font-bold">Category Name</th>
                    <th className="py-3.5 px-4 font-bold">Category Type & Parent</th>
                    <th className="py-3.5 px-4 font-bold">Sort Order</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-border">
                  {paginatedCategories.map((cat) => {
                    const isSub = !!cat.parent;
                    const parentCategory = cat.parent
                      ? categories.find((c) => c.id === cat.parent)
                      : null;
                    const parentName = parentCategory
                      ? parentCategory.name
                      : cat.parent
                      ? `Parent ID #${cat.parent}`
                      : 'Top-Level Parent';

                    return (
                      <tr key={cat.id} className="hover:bg-bg-hover/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-content-muted">
                          #{cat.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-head font-bold text-content-primary text-sm flex items-center space-x-2">
                            {isSub && <CornerDownRight className="w-3.5 h-3.5 text-amber-400" />}
                            <span>{cat.name}</span>
                            {cat.children && cat.children.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-primary-500/15 text-primary-400 font-mono text-[9px]">
                                {cat.children.length} subs
                              </span>
                            )}
                          </div>
                          {cat.slug && (
                            <div className="text-[10px] font-mono text-content-muted pl-5">{cat.slug}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isSub ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1 w-max">
                              <Layers className="w-3 h-3" />
                              <span>Sub of: {parentName}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-primary-500/15 text-primary-400 border border-primary-500/30 w-max inline-block">
                              Top-Level Master Parent
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-content-primary">
                          {cat.sort_order ?? 0}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold inline-flex items-center space-x-1 ${
                              cat.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-bg-surface text-content-muted border border-bg-border'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cat.status === 'active' ? 'bg-emerald-400' : 'bg-content-muted'
                              }`}
                            />
                            <span className="capitalize">{cat.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {!isSub && (
                              <button
                                onClick={() => openCreateModal(cat.id)}
                                className="p-1.5 rounded-lg bg-bg-surface hover:bg-primary-500/20 text-primary-400 border border-bg-border transition-colors"
                                title="Add Sub-category under this parent"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-primary-500/20 text-primary-400 border border-bg-border transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(cat.id)}
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-rose-500/20 text-rose-400 border border-bg-border transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCategories.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-bg-card border border-bg-border rounded-3xl p-6 shadow-glow space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-bg-border pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/30">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-head font-bold text-lg text-content-primary">
                    {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create Category'}
                  </h3>
                  <p className="text-xs text-content-muted">
                    Configure multi-level hierarchy & SEO metadata form fields
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-content-muted hover:text-content-primary hover:bg-bg-hover transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Antibiotics & Anti-infectives"
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Parent Category (Optional for Sub-category)
                  </label>
                  <select
                    value={parent}
                    onChange={(e) => setParent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
                  >
                    <option value="">None (Top-Level Category)</option>
                    {categories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Sort Order Priority
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-mono font-bold outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-content-muted mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'hidden')}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border text-content-primary text-xs font-medium outline-none focus:border-primary-500"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="hidden">Hidden (Draft)</option>
                  </select>
                </div>
              </div>

              {/* SEO Box */}
              <div className="p-4 rounded-2xl bg-bg-surface border border-bg-border space-y-3">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-content-muted uppercase">
                  <Sparkles className="w-4 h-4 text-accent-400" />
                  <span>SEO Title & Description (`metadata`)</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="e.g. Buy Prescription Antibiotics Online in Bangladesh"
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-content-muted mb-1">SEO Description</label>
                    <textarea
                      rows={2}
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="Meta description for search engines..."
                      className="w-full px-3.5 py-2 rounded-xl bg-bg-card border border-bg-border text-content-primary text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC META FORM BUILDER */}
              <DynamicMetaKeyValueBuilder
                title="Dynamic Metadata Form Builder"
                description="Fill up extra category attributes like a form"
                pairs={metaPairs}
                onChange={setMetaPairs}
                presetSuggestions={[
                  'show_on_homepage',
                  'banner_subtitle',
                  'discount_tag',
                  'icon_name',
                ]}
              />

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-bg-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-bg-surface hover:bg-bg-hover border border-bg-border text-content-secondary font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-bold text-xs shadow-glow transition-all flex items-center space-x-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-bg-card border border-rose-500/40 rounded-3xl p-6 shadow-glow space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-head font-bold text-lg text-content-primary">Delete Category</h3>
            <p className="text-xs text-content-muted">
              Are you sure you want to delete category #{deleteConfirmId}? This communicates directly with DRF API.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2 rounded-xl bg-bg-surface hover:bg-bg-hover border border-bg-border text-content-secondary text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-glow transition-all"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
