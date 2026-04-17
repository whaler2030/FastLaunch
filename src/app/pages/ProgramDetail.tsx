import { confirm } from '@tauri-apps/plugin-dialog';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { useParams, Link, useNavigate } from 'react-router';
import { useState } from 'react';
import { usePrograms } from '../hooks/usePrograms';
import { runProgram, listenRunOutput } from '../../api/executor';
import { getLucideIcon } from '../components/ui/utils';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import {
  ArrowLeft,
  Play,
  FolderOpen,
  Terminal,
  Heart,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Folder,
  FileCode,
} from 'lucide-react';
import { toast } from 'sonner';

export function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { programs, deleteProgram, toggleFavorite } = usePrograms();
  const [runOutput, setRunOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const program = programs.find((p) => p.id === id);

  if (!program) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">程序未找到</h2>
          <Link to="/">
            <Button>返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = getLucideIcon(program.icon);

  const handleRun = async () => {
    if (!program || isRunning) return;

    setIsRunning(true);
    setRunOutput('');

    // 监听实时输出
    const unlisten = await listenRunOutput((output) => {
      setRunOutput((prev) => prev + output);
    });

    try {
      const result = await runProgram(program.id);
      if (result.success) {
        toast.success(`运行成功，耗时 ${result.duration_ms}ms`);
      } else {
        toast.error(`运行失败: ${result.error}`);
      }
    } finally {
      setIsRunning(false);
      unlisten();
    }
  };

  const handleShowPath = () => {
    // Handle clipboard API with fallback for blocked environments
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(program.path).then(
        () => toast.success('路径已复制到剪贴板'),
        () => toast.info(`路径: ${program.path}`)
      );
    } else {
      toast.info(`路径: ${program.path}`);
    }
  };

  const handleOpenTerminal = async () => {
    try {
      // 打开脚本所在目录（会用 Finder 打开）
      const scriptDir = program.path.substring(0, program.path.lastIndexOf('/'));
      await shellOpen(scriptDir);
      toast.success(`已打开脚本目录`);
    } catch (error) {
      console.error('Open directory error:', error);
      toast.error(`打开目录失败: ${error}`);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirm(`确定要删除 "${program?.name}" 吗?`, {
      title: '删除确认',
      kind: 'warning',
    });
    if (confirmed) {
      deleteProgram(id!);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-xl">
                <IconComponent className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  {program.name}
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {program.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => toggleFavorite(program.id)}>
                <Heart
                  className={`w-5 h-5 ${
                    program.favorite
                      ? 'fill-red-500 text-red-500'
                      : 'text-zinc-400'
                  }`}
                />
              </Button>
              <Link to={`/program/${program.id}/edit`}>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  编辑
                </Button>
              </Link>
              <Button variant="outline" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2 text-red-500" />
                删除
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="col-span-2 space-y-6">
            {/* Actions Card */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">快速操作</h3>
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                  onClick={handleRun}
                >
                  <Play className="w-5 h-5 mr-2" />
                  运行程序
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={handleShowPath}
                >
                  <FolderOpen className="w-5 h-5 mr-2" />
                  查看路径
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1"
                  onClick={handleOpenTerminal}
                >
                  <Terminal className="w-5 h-5 mr-2" />
                  打开目录
                </Button>
              </div>
            </Card>

            {/* Run Output Panel */}
            {(isRunning || runOutput) && (
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <Terminal className="w-5 h-5 mr-2 text-green-500" />
                  运行输出
                </h3>
                <div className="bg-zinc-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-80">
                  {isRunning && !runOutput && <span className="animate-pulse">执行中...</span>}
                  {runOutput}
                </div>
              </Card>
            )}

            {/* Path Card */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center">
                <FileCode className="w-5 h-5 mr-2 text-blue-500" />
                文件信息
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    文件路径
                  </label>
                  <div className="mt-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg font-mono text-sm break-all">
                    {program.path}
                  </div>
                </div>
              </div>
            </Card>

            {/* Description Card */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">详细说明</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {program.description}
              </p>
            </Card>

            {/* Tags Card */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">标签</h3>
              <div className="flex flex-wrap gap-2">
                {program.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Info Card - removed Stats Card as it has no real data */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">基本信息</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      分类
                    </p>
                    <p className="font-medium">
                      {program.category === 'data'
                        ? '数据处理'
                        : program.category === 'automation'
                        ? '自动化工具'
                        : program.category === 'web'
                        ? 'Web 开发'
                        : program.category === 'ml'
                        ? '机器学习'
                        : '其他'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      创建日期
                    </p>
                    <p className="font-medium">{program.createdAt}</p>
                  </div>
                </div>

                {program.lastRun && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          最后运行
                        </p>
                        <p className="font-medium">{program.lastRun}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}