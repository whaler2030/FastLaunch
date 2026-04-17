import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Program } from '../types/program';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { getLucideIcon } from './ui/utils';
import { useCustomIcon } from '../hooks/useCustomIcon';
import { confirm } from '@tauri-apps/plugin-dialog';
import { runProgram, openDirectory, runInTerminal } from '../../api/executor';
import {
  Play,
  FolderOpen,
  Terminal,
  Heart,
  MoreVertical,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';

interface ProgramCardProps {
  program: Program;
  onRun?: (program: Program) => void;
  onDelete?: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export function ProgramCard({
  program,
  onRun,
  onDelete,
  onToggleFavorite,
}: ProgramCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // 获取图标信息
  const IconComponent = getLucideIcon(program.iconType === 'custom' ? 'Code' : program.icon);
  const { loading: iconLoading, base64: iconBase64, isCustom } = useCustomIcon(program.icon, program.iconType);

  const handleRun = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(`正在运行 "${program.name}"...`);

    try {
      const result = await runProgram(program.id);
      if (result.success) {
        toast.success(`运行成功，耗时 ${result.duration_ms}ms`);
        // 更新 lastRun 时间
        onRun?.(program);
      } else {
        toast.error(`运行失败: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('Run error:', error);
      toast.error(`运行失败: ${error}`);
    }
  };

  const handleShowPath = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleOpenTerminal = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await runInTerminal(program.path);
      toast.success(`已在终端打开脚本`);
    } catch (error) {
      console.error('Open terminal error:', error);
      toast.error(`打开终端失败: ${error}`);
    }
  };

  const handleOpenDir = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await openDirectory(program.path);
      toast.success(`已打开脚本目录`);
    } catch (error) {
      console.error('Open directory error:', error);
      toast.error(`打开目录失败: ${error}`);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(program.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = await confirm(`确定要删除 "${program.name}" 吗?`, {
      title: '删除确认',
      kind: 'warning',
    });
    if (confirmed) {
      onDelete?.(program.id);
      toast.success('程序已删除');
    }
  };

  const navigate = useNavigate();

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/program/${program.id}/edit`);
  };

  return (
    <Link to={`/program/${program.id}`}>
      <Card
        className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg overflow-hidden">
                {isCustom && iconBase64 ? (
                  <img
                    src={iconBase64}
                    alt={program.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <IconComponent className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  {program.name}
                </h3>
                {program.lastRun && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    上次运行: {program.lastRun}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleToggleFavorite}
              >
                <Heart
                  className={`w-4 h-4 ${
                    program.favorite
                      ? 'fill-red-500 text-red-500'
                      : 'text-zinc-400'
                  }`}
                />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
            {program.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {program.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Action Buttons - Show on hover */}
          <div
            className={`flex gap-2 transition-all duration-300 ${
              isHovered
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-2'
            }`}
          >
            <Button
              size="sm"
              title="执行 Python 程序"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              onClick={handleRun}
            >
              <Play className="w-4 h-4 mr-1" />
              运行
            </Button>

            <Button
              size="sm"
              variant="outline"
              title="打开脚本目录"
              onClick={handleOpenDir}
            >
              <FolderOpen className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              title="在终端运行"
              onClick={handleOpenTerminal}
            >
              <Terminal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Favorite indicator */}
        {program.favorite && (
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
            <div className="absolute top-3 right-[-32px] w-32 h-6 bg-gradient-to-r from-amber-400 to-amber-500 rotate-45 shadow-sm" />
          </div>
        )}
      </Card>
    </Link>
  );
}