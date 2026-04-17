import { useState, useEffect, useCallback } from 'react';
import { Category } from '../../api/categories';
import { loadCategories, addCategory, updateCategory, deleteCategory } from '../../api/categories';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories()
      .then(setCategories)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = useCallback(async (category: Category) => {
    await addCategory(category);
    setCategories((prev) => [...prev, category]);
  }, []);

  const handleUpdate = useCallback(async (category: Category) => {
    await updateCategory(category);
    setCategories((prev) =>
      prev.map((c) => (c.id === category.id ? category : c))
    );
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadCategories();
      setCategories(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    categories,
    loading,
    error,
    addCategory: handleAdd,
    updateCategory: handleUpdate,
    deleteCategory: handleDelete,
    refresh,
  };
}