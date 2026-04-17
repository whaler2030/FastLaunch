import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { open } from '@tauri-apps/plugin-dialog';
import { usePrograms } from '../hooks/usePrograms';
import { getPythonVersions } from '../../api/executor';
import { getLucideIcon } from '../components/ui/utils';
import { Program } from '../types/program';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Save, X, FolderOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const categoryOptions = [
  { value: 'data', label: '数据处理' },
  { value: 'automation', label: '自动化工具' },
  { value: 'web', label: 'Web 开发' },
  { value: 'ml', label: '机器学习' },
];

const iconOptions = [
  'FileSpreadsheet',
  'Mail',
  'Image',
  'Network',
  'FileText',
  'Database',
  'Code',
  'FileSearch',
  'HardDrive',
  'Brain',
  'Braces',
  'Activity',
  'Terminal',
  'Settings',
  'Zap',
  'Cloud',
];

export function ProgramForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { programs, addProgram, updateProgram } = usePrograms();

  const existingProgram = isEdit ? programs.find((p) => p.id === id) : null;

  const [formData, setFormData] = useState({
    name: existingProgram?.name || '',
    description: existingProgram?.description || '',
    icon: existingProgram?.icon || 'Code',
    path: existingProgram?.path || '',
    category: existingProgram?.category || 'data',
    tags: existingProgram?.tags || [],
    pythonPath: existingProgram?.pythonPath || '',
    createdAt: existingProgram?.createdAt || '',
  });

  const [tagInput, setTagInput] = useState('');
  const [pythonVersions, setPythonVersions] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load Python versions on mount
  useEffect(() => {
    getPythonVersions()
      .then((versions) => {
        setPythonVersions(versions);
        // Set default python path if not already set
        if (!formData.pythonPath && versions.length > 0) {
          setFormData((prev) => ({ ...prev, pythonPath: versions[0] }));
        }
      })
      .catch((err) => {
        console.error('Failed to load Python versions:', err);
        toast.error('无法加载 Python 版本列表');
      })
      .finally(() => setLoadingVersions(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.path) {
      toast.error('请填写必填项');
      return;
    }

    setSubmitting(true);

    try {
      const program: Program = {
        id: isEdit ? id! : Date.now().toString(),
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        path: formData.path,
        category: formData.category,
        tags: formData.tags,
        pythonPath: formData.pythonPath,
        createdAt: isEdit ? formData.createdAt : new Date().toISOString().split('T')[0],
      };

      if (isEdit) {
        await updateProgram(program);
        toast.success('程序已更新');
      } else {
        await addProgram(program);
        toast.success('程序已添加');
      }

      navigate('/');
    } catch (error) {
      console.error('Failed to save program:', error);
      toast.error(isEdit ? '更新程序失败' : '添加程序失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  const handleSelectFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Python', extensions: ['py'] }],
      });

      if (selected && typeof selected === 'string') {
        setFormData((prev) => ({ ...prev, path: selected }));
        toast.success('文件已选择');

        // Auto-fill program name from filename if not already set
        if (!formData.name) {
          const fileName = selected.split('/').pop() || selected.split('\\').pop() || '';
          if (fileName.endsWith('.py')) {
            const programName = fileName
              .replace('.py', '')
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            setFormData((prev) => ({ ...prev, name: programName }));
          }
        }
      }
    } catch (error) {
      console.error('File selection cancelled or failed:', error);
    }
  };

  const SelectedIcon = getLucideIcon(formData.icon);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-8 py-6">
          <Link to={isEdit ? `/program/${id}` : '/'}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </Link>

          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {isEdit ? '编辑程序' : '添加新程序'}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            {isEdit ? '修改程序信息' : '填写程序信息以添加到管理器'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit}>
          <Card className="p-8">
            <div className="space-y-6">
              {/* Icon Selection */}
              <div>
                <Label htmlFor="icon">程序图标 *</Label>
                <div className="mt-2 grid grid-cols-8 gap-3">
                  {iconOptions.map((iconName) => {
                    const IconComponent = getLucideIcon(iconName);
                    return (
                      <button
                        key={iconName}
                        type="button"
                        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                          formData.icon === iconName
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                        onClick={() => setFormData({ ...formData, icon: iconName })}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="name">程序名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="例如: Data Cleaner"
                  className="mt-2"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">程序描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="简要描述程序的功能..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              {/* Path */}
              <div>
                <Label htmlFor="path">文件路径 *</Label>
                <div className="relative flex gap-2 mt-2">
                  <Input
                    id="path"
                    value={formData.path}
                    onChange={(e) =>
                      setFormData({ ...formData, path: e.target.value })
                    }
                    placeholder="/Users/username/python/script.py"
                    className="font-mono text-sm flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSelectFile}
                    className="shrink-0"
                  >
                    <FolderOpen className="w-4 h-4 mr-2" />
                    选择文件
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  选择或输入 Python 脚本的完整路径
                </p>
              </div>

              {/* Python Version */}
              <div>
                <Label htmlFor="pythonPath">Python 解释器</Label>
                <Select
                  value={formData.pythonPath}
                  onValueChange={(value) =>
                    setFormData({ ...formData, pythonPath: value })
                  }
                  disabled={loadingVersions}
                >
                  <SelectTrigger className="mt-2">
                    {loadingVersions ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>加载中...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="选择 Python 版本" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {pythonVersions.map((version) => (
                      <SelectItem key={version} value={version}>
                        {version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-500 mt-1">
                  选择运行此程序使用的 Python 解释器
                </p>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category">程序分类 *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div>
                <Label htmlFor="tags">标签</Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="输入标签后按回车"
                  />
                  <Button type="button" onClick={handleAddTag}>
                    添加
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview */}
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <Label>预览</Label>
                <div className="mt-3 p-6 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                      <SelectedIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {formData.name || '程序名称'}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {formData.description || '程序描述'}
                      </p>
                    </div>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <Link to={isEdit ? `/program/${id}` : '/'}>
                <Button type="button" variant="outline">
                  取消
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isEdit ? '保存更改' : '添加程序'}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}