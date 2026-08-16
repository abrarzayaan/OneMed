import { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown, Sparkles, Moon, Sun, Snowflake, Flame, Type } from 'lucide-react';
import { useThemeStore, THEME_OPTIONS, type ThemeId } from '@/store/theme.store';
import toast from 'react-hot-toast';

const THEME_ICONS: Record<ThemeId, typeof Palette> = {
  midnight: Moon,
  'emerald-light': Sun,
  'nordic-frost': Snowflake,
  'golden-obsidian': Flame,
};

export default function ThemeSelector() {
  const { currentTheme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = THEME_OPTIONS.find((t) => t.id === currentTheme) || THEME_OPTIONS[0];
  const ActiveIcon = THEME_ICONS[currentTheme] || Palette;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: ThemeId, name: string, fontName: string) => {
    setTheme(id);
    setIsOpen(false);
    toast.success(`Theme: ${name} (${fontName})`, {
      id: 'theme-change',
      style: {
        background: 'rgb(var(--bg-card))',
        color: 'rgb(var(--content-primary))',
        border: '1px solid rgb(var(--bg-border))',
      },
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-bg-card border border-bg-border hover:border-primary-500/50 text-content-primary text-xs font-semibold transition-all hover:bg-bg-surface"
        title="Change IDE Theme & Typography"
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-3.5 h-3.5 rounded-full border border-bg-border shrink-0 shadow-sm"
            style={{ backgroundColor: activeOption.preview.primary }}
          />
          <ActiveIcon className="w-3.5 h-3.5 text-primary-400" />
        </div>
        <span className="hidden sm:inline-block max-w-[110px] truncate">
          {activeOption.name}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-content-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-bg-card border border-bg-border rounded-2xl shadow-card p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 border-b border-bg-border flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-content-primary">
              <Palette className="w-4 h-4 text-primary-400" />
              <span>Theme & Font Selector</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 uppercase">
              4 Dynamic Themes
            </span>
          </div>

          <div className="py-1 space-y-1">
            {THEME_OPTIONS.map((theme) => {
              const isSelected = theme.id === currentTheme;
              const Icon = THEME_ICONS[theme.id];

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelect(theme.id, theme.name, theme.fontName)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-primary-600/20 border border-primary-500/40 text-content-primary'
                      : 'hover:bg-bg-surface text-content-secondary hover:text-content-primary border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Color Swatch Triad */}
                    <div className="flex items-center -space-x-1 shrink-0">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-bg-border"
                        style={{ backgroundColor: theme.preview.bg }}
                        title="Background"
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-bg-border z-10"
                        style={{ backgroundColor: theme.preview.primary }}
                        title="Primary Color"
                      />
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-bg-border z-20"
                        style={{ backgroundColor: theme.preview.accent }}
                        title="Accent Color"
                      />
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-primary-400 shrink-0" />
                        <p className="text-xs font-bold truncate leading-tight">
                          {theme.name}
                        </p>
                      </div>
                      <p className="text-[10px] text-content-muted truncate mt-0.5">
                        {theme.tagline}
                      </p>
                      <div className="flex items-center gap-1 text-[9px] text-primary-400 font-medium mt-1">
                        <Type className="w-2.5 h-2.5" />
                        <span>Font: {theme.fontName}</span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-primary-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
