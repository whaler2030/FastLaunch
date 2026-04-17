import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Category } from '../../api/categories';
import { getLucideIcon } from './ui/utils';
import { Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (category: Category) => Promise<void>;
  onUpdate: (category: Category) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const iconOptions = [
  'Database', 'Zap', 'Globe', 'Brain', 'Folder', 'Code', 'FileCode',
  'Terminal', 'Settings', 'Activity', 'Cloud', 'Network', 'Cpu',
  'Layers', 'Package', 'FileText', 'Image', 'Music', 'Video',
];

export function CategoryManager({
  categories,
  onAdd,
  onUpdate,
  onDelete,
}: CategoryManagerProps) {
  const [open, setOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', icon: 'Folder' });

  const handleSaveAdd = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }

    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: formData.name.trim(),
      icon: formData.icon,
      sortOrder: categories.length + 1,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      await onAdd(newCategory);
      toast.success('分类已添加');
      setIsAddMode(false);
      setFormData({ name: '', icon: 'Folder' });
    } catch {
      toast.error('添加失败');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !formData.name.trim()) {
      toast.error('请输入分类名称');
      return;
    }

    const existing = categories.find((c) => c.id === editingId);
    if (!existing) return;

    const updated: Category = {
      ...existing,
      name: formData.name.trim(),
      icon: formData.icon,
    };

    try {
      await onUpdate(updated);
      toast.success('分类已更新');
      setEditingId(null);
      setFormData({ name: '', icon: 'Folder' });
    } catch {
      toast.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast.success('分类已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, icon: category.icon });
    setIsAddMode(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', icon: 'Folder' });
  };

  const cancelAdd = () => {
    setIsAddMode(false);
    setFormData({ name: '', icon: 'Folder' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
          <Settings className="w-4 h-4 mr-2" />
          管理分类
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>分类管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* 分类列表 */}
          {categories.map((category) => {
            const IconComponent = getLucideIcon(category.icon);
            return (
              <div
                key={category.id}
                className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                {editingId === category.id ? (
                  <>
                    <div className="flex gap-1 shrink-0">
                      {iconOptions.slice(0, 6).map((icon) => {
                        const Icon = getLucideIcon(icon);
                        return (
                          <button
                            key={icon}
                            type="button"
                            className={`w-6 h-6 rounded flex items-center justify-center ${
                              formData.icon === icon
                                ? 'bg-blue-500 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600'
                            }`}
                            onClick={() => setFormData({ ...formData, icon })}
                          >
                            <Icon className="w-3 h-3" />
                          </button>
                        );
                      })}
                    </div>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-8 flex-1"
                      autoFocus
                    />
                    <Button size="sm" className="h-8 px-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white" onClick={handleSaveEdit}>
                      保存
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={cancelEdit}>
                      取消
                    </Button>
                  </>
                ) : (
                  <>
                    <IconComponent className="w-4 h-4 text-zinc-500" />
                    <span className="flex-1 text-sm">{category.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => startEdit(category)}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            );
          })}

          {/* 添加新分类 */}
          {isAddMode ? (
            <div className="space-y-3 p-3 border rounded-lg">
              <Label className="text-sm">选择图标</Label>
              <div className="grid grid-cols-10 gap-1">
                {iconOptions.map((icon) => {
                  const Icon = getLucideIcon(icon);
                  return (
                    <button
                      key={icon}
                      type="button"
                      className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                        formData.icon === icon
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110'
                          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}
              </div>
              <Input
                placeholder="分类名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white" onClick={handleSaveAdd}>
                  添加
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelAdd}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            !editingId && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setIsAddMode(true)}>
                <Plus className="w-4 h-4 mr-2" />
                添加分类
              </Button>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}