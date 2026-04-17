import { useState, useEffect, useCallback } from 'react';
import { Program } from '../types/program';
import { loadPrograms, addProgram, deleteProgram, updateProgram } from '../../api/programs';

export function usePrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load programs on mount
  useEffect(() => {
    loadPrograms()
      .then(setPrograms)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = useCallback(async (program: Program) => {
    await addProgram(program);
    setPrograms((prev) => [...prev, program]);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteProgram(id);
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleUpdate = useCallback(async (program: Program) => {
    await updateProgram(program);
    setPrograms((prev) =>
      prev.map((p) => (p.id === program.id ? program : p))
    );
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
    const program = programs.find((p) => p.id === id);
    if (program) {
      const updated = { ...program, favorite: !program.favorite };
      await updateProgram(updated);
      setPrograms((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
    }
  }, [programs]);

  return {
    programs,
    loading,
    error,
    addProgram: handleAdd,
    deleteProgram: handleDelete,
    updateProgram: handleUpdate,
    toggleFavorite: handleToggleFavorite,
  };
}