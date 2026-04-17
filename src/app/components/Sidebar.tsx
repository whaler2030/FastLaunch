import { Category as CategoryType } from '../types/program';
import { Category } from '../../api/categories';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Plus, Star, Rocket } from 'lucide-react';
import { Link } from 'react-router';
import { getLucideIcon } from './ui/utils';
import { CategoryManager } from './CategoryManager';

interface SidebarProps {
  categories: CategoryType[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  showFavorites: boolean;
  onToggleFavorites: () => void;
  managedCategories?: Category[];
  onAddCategory?: (category: Category) => Promise<void>;
  onUpdateCategory?: (category: Category) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

export function Sidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  showFavorites,
  onToggleFavorites,
  managedCategories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: SidebarProps) {
  return (
    <div className="w-64 h-screen bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      {/* Logo & Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl text-zinc-900 dark:text-zinc-100">
              FastLaunch
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Python 管理器
            </p>
          </div>
        </div>

        <Link to="/add">
          <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            添加程序
          </Button>
        </Link>
      </div>

      {/* Categories */}
      <ScrollArea className="flex-1 px-3 py-4">
        {/* Favorites */}
        <div className="mb-4">
          <Button
            variant={showFavorites ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={onToggleFavorites}
          >
            <Star
              className={`w-4 h-4 mr-3 ${
                showFavorites ? 'fill-amber-500 text-amber-500' : ''
              }`}
            />
            我的收藏
          </Button>
        </div>

        <Separator className="my-4" />

        {/* Category List */}
        <div className="space-y-1">
          <p className="px-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            分类
          </p>
          {categories.map((category) => {
            const IconComponent = getLucideIcon(category.icon);

            return (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? 'secondary' : 'ghost'
                }
                className="w-full justify-start group"
                onClick={() => onSelectCategory(category.id)}
              >
                <IconComponent className="w-4 h-4 mr-3" />
                <span className="flex-1 text-left">{category.name}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {category.count}
                </span>
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        {managedCategories && onAddCategory && onUpdateCategory && onDeleteCategory && (
          <CategoryManager
            categories={managedCategories}
            onAdd={onAddCategory}
            onUpdate={onUpdateCategory}
            onDelete={onDeleteCategory}
          />
        )}
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>v1.0.0</span>
          <span>© 2026 FastLaunch</span>
        </div>
      </div>
    </div>
  );
}
