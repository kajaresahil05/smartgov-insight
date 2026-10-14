import React from 'react';
import { FolderKanban, Bell, Target, UploadCloud, FileText, BarChart3, Building, Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'folder' | 'bell' | 'target' | 'upload' | 'file' | 'chart' | 'building' | 'search';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon = 'folder',
  title,
  description,
  actionText,
  onAction,
  actionIcon,
  compact = false
}: EmptyStateProps) {
  const getIcon = () => {
    switch (icon) {
      case 'bell':
        return <Bell className="w-8 h-8 text-violet-400 stroke-[1.75]" />;
      case 'target':
        return <Target className="w-8 h-8 text-violet-400 stroke-[1.75]" />;
      case 'upload':
        return <UploadCloud className="w-8 h-8 text-violet-400 stroke-[1.75]" />;
      case 'file':
        return <FileText className="w-8 h-8 text-violet-400 stroke-[1.75]" />;
      case 'chart':
        return <BarChart3 className="w-8 h-8 text-violet-400 stroke-[1.75]" />;
      case 'building':
        return <Building className="w-8 h-8 text-violet-400 stroke-[1.75]" />;
      case 'search':
        return <Search className="w-8 h-8 text-violet-400 stroke-[1.75]" />;
      case 'folder':
      default:
        return <FolderKanban className="w-8 h-8 text-violet-400 stroke-[1.75]" />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-14 px-6'} bg-white rounded-3xl border border-slate-100/80 shadow-2xs`}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-violet-100/80 to-purple-50 flex items-center justify-center mb-4 shadow-sm shadow-violet-100/50">
        {getIcon()}
      </div>
      <h3 className="text-base font-bold text-slate-800 tracking-tight mb-1.5">{title}</h3>
      <p className="text-xs text-slate-400 font-medium max-w-md leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-violet-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          {actionIcon}
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
