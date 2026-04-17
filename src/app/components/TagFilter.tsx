import { Badge } from './ui/badge';
import { X } from 'lucide-react';

interface TagFilterProps {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
}

export function TagFilter({ tags, selectedTags, onToggleTag }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag);
        return (
          <Badge
            key={tag}
            variant={isSelected ? 'default' : 'outline'}
            className={`cursor-pointer transition-all ${
              isSelected
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
            onClick={() => onToggleTag(tag)}
          >
            {tag}
            {isSelected && <X className="w-3 h-3 ml-1" />}
          </Badge>
        );
      })}
    </div>
  );
}
