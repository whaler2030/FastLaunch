import { useMemo, useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { SearchBar } from '../components/SearchBar';
import { TagFilter } from '../components/TagFilter';
import { ProgramCard } from '../components/ProgramCard';
import { usePrograms } from '../hooks/usePrograms';
import { Program } from '../types/program';
import { SlidersHorizontal, LayoutGrid, List } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

export function Home() {
  const { programs, loading, error, deleteProgram, updateProgram, toggleFavorite } = usePrograms();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'lastRun'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Compute categories dynamically from programs
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    programs.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    return [
      { id: 'all', name: '全部程序', icon: 'Grid3x3', count: programs.length },
      { id: 'data', name: '数据处理', icon: 'Database', count: counts['data'] || 0 },
      { id: 'automation', name: '自动化工具', icon: 'Zap', count: counts['automation'] || 0 },
      { id: 'web', name: 'Web 开发', icon: 'Globe', count: counts['web'] || 0 },
      { id: 'ml', name: '机器学习', icon: 'Brain', count: counts['ml'] || 0 },
    ];
  }, [programs]);

  // Compute all tags dynamically from programs
  const allTags = useMemo(() => {
    return Array.from(new Set(programs.flatMap((p) => p.tags))).sort();
  }, [programs]);

  // Filter and sort programs
  const filteredPrograms = useMemo(() => {
    let filtered = programs;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by favorites
    if (showFavorites) {
      filtered = filtered.filter((p) => p.favorite);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) =>
        selectedTags.every((tag) => p.tags.includes(tag))
      );
    }

    // Sort programs
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'lastRun':
          if (!a.lastRun) return 1;
          if (!b.lastRun) return -1;
          return new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [programs, selectedCategory, searchQuery, selectedTags, showFavorites, sortBy]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
  };

  const handleDelete = (id: string) => {
    deleteProgram(id);
  };

  const handleRun = async (program: Program) => {
    await updateProgram({
      ...program,
      lastRun: new Date().toISOString().split('T')[0],
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4 mx-auto"></div>
          <p className="text-zinc-500">加载中...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        showFavorites={showFavorites}
        onToggleFavorites={() => setShowFavorites((prev) => !prev)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {showFavorites
                  ? '我的收藏'
                  : categories.find((c) => c.id === selectedCategory)?.name ||
                    '全部程序'}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                共 {filteredPrograms.length} 个程序
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    排序
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>排序方式</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    按名称
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('date')}>
                    按创建日期
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('lastRun')}>
                    按最近运行
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                标签筛选
              </p>
              <TagFilter
                tags={allTags}
                selectedTags={selectedTags}
                onToggleTag={handleToggleTag}
              />
            </div>
          )}
        </div>

        {/* Programs Grid */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {filteredPrograms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <LayoutGrid className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                未找到程序
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                尝试调整筛选条件或搜索关键词
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredPrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  onRun={handleRun}
                  onDelete={handleDelete}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
