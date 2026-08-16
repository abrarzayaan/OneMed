import React from 'react';
import { Plus, Trash2, SlidersHorizontal, Sparkles, HelpCircle } from 'lucide-react';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
}

interface DynamicMetaKeyValueBuilderProps {
  title: string;
  description: string;
  pairs: KeyValuePair[];
  onChange: (updatedPairs: KeyValuePair[]) => void;
  presetSuggestions?: string[];
}

export const DynamicMetaKeyValueBuilder: React.FC<DynamicMetaKeyValueBuilderProps> = ({
  title,
  description,
  pairs,
  onChange,
  presetSuggestions = [
    'Key Highlights & Features',
    'Dosage & Administration',
    'Storage & Safety Advice',
    'Warnings & Precautions',
    'Side Effects',
  ],
}) => {
  const addPair = (initialKey = '', initialValue = '') => {
    const newPair: KeyValuePair = {
      id: Math.random().toString(36).substring(2, 9),
      key: initialKey,
      value: initialValue,
    };
    onChange([...pairs, newPair]);
  };

  const updatePair = (id: string, field: 'key' | 'value', text: string) => {
    onChange(
      pairs.map((p) => (p.id === id ? { ...p, [field]: text } : p))
    );
  };

  const removePair = (id: string) => {
    onChange(pairs.filter((p) => p.id !== id));
  };

  return (
    <div className="p-5 rounded-2xl bg-bg-surface border border-bg-border space-y-4">
      <div className="flex items-center justify-between border-b border-bg-border pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-primary-500/15 text-primary-400 border border-primary-500/30">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-head font-bold text-content-primary">{title}</h3>
            <p className="text-xs text-content-muted">{description}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => addPair()}
          className="px-3 py-1.5 rounded-xl bg-primary-500/15 hover:bg-primary-500/25 text-primary-400 border border-primary-500/30 font-bold text-xs flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Field</span>
        </button>
      </div>

      {/* Quick Add Suggestions Chips */}
      {presetSuggestions && presetSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-content-muted flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent-400" /> Quick Add Suggestions:
          </span>
          {presetSuggestions.map((suggestion) => {
            const alreadyExists = pairs.some((p) => p.key === suggestion);
            return (
              <button
                key={suggestion}
                type="button"
                disabled={alreadyExists}
                onClick={() => addPair(suggestion, '')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
                  alreadyExists
                    ? 'bg-bg-card text-content-muted border border-bg-border opacity-40 cursor-not-allowed'
                    : 'bg-bg-card hover:bg-primary-500/10 text-content-secondary hover:text-primary-400 border border-bg-border hover:border-primary-500/30'
                }`}
              >
                + {suggestion}
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic Key Value Pairs List */}
      <div className="space-y-3 pt-1">
        {pairs.length === 0 ? (
          <div className="p-4 rounded-xl bg-bg-card/50 border border-dashed border-bg-border text-center text-xs text-content-muted">
            No dynamic specs added yet. Click &quot;Add Custom Field&quot; or choose a suggestion above.
          </div>
        ) : (
          pairs.map((pair, idx) => (
            <div
              key={pair.id}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-3 rounded-xl bg-bg-card border border-bg-border items-center animate-in fade-in zoom-in-95 duration-150"
            >
              {/* Field Label / Key */}
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={pair.key}
                  onChange={(e) => updatePair(pair.id, 'key', e.target.value)}
                  placeholder={`Field Name #${idx + 1} (e.g. Key Highlights)`}
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-surface border border-bg-border text-content-primary font-mono text-xs font-semibold outline-none focus:border-primary-500"
                />
              </div>

              {/* Field Content / Value */}
              <div className="sm:col-span-7">
                <input
                  type="text"
                  value={pair.value}
                  onChange={(e) => updatePair(pair.id, 'value', e.target.value)}
                  placeholder="Field Details / Content..."
                  className="w-full px-3 py-1.5 rounded-lg bg-bg-surface border border-bg-border text-content-primary text-xs outline-none focus:border-primary-500"
                />
              </div>

              {/* Remove Button */}
              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removePair(pair.id)}
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                  title="Remove Field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
