import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SectionPlaceholderProps {
  title: string;
  sectionNumber: string;
  description: string;
  icon: LucideIcon;
  badgeText: string;
}

export const AdminSectionPlaceholder: React.FC<SectionPlaceholderProps> = ({
  title,
  sectionNumber,
  description,
  icon: Icon,
  badgeText,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-content-muted hover:text-content-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Executive Dashboard</span>
        </button>
        <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 font-mono text-xs font-semibold border border-primary-500/30">
          {sectionNumber}
        </span>
      </div>

      <div className="p-8 sm:p-12 rounded-3xl bg-bg-card border border-bg-border shadow-2xl text-center space-y-4 max-w-3xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-500 shadow-glow flex items-center justify-center text-white mx-auto">
          <Icon className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold border border-emerald-500/30">
          {badgeText}
        </div>

        <h1 className="text-2xl sm:text-3xl font-head font-bold text-content-primary">
          {title}
        </h1>

        <p className="text-sm text-content-secondary max-w-xl mx-auto">
          {description}
        </p>

        <div className="pt-4 flex items-center justify-center space-x-3">
          <button
            onClick={() => navigate('/admin')}
            className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs shadow-glow transition-all"
          >
            Dashboard Overview
          </button>
        </div>
      </div>
    </div>
  );
};
