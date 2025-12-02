'use client';

/**
 * CSSVariableInspector - View and inspect CSS custom properties in real-time
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { cn } from '../../utils';

// =============================================================================
// Types
// =============================================================================

interface CSSVariable {
  name: string;
  value: string;
  category: VariableCategory;
  computed?: string;
}

type VariableCategory = 
  | 'color'
  | 'spacing'
  | 'typography'
  | 'radius'
  | 'shadow'
  | 'transition'
  | 'other';

// =============================================================================
// Variable Categories
// =============================================================================

function categorizeVariable(name: string): VariableCategory {
  if (name.includes('color') || name.includes('bg') || name.includes('text') || name.includes('border')) {
    return 'color';
  }
  if (name.includes('spacing') || name.includes('gap') || name.includes('padding') || name.includes('margin')) {
    return 'spacing';
  }
  if (name.includes('font') || name.includes('text') || name.includes('line')) {
    return 'typography';
  }
  if (name.includes('radius') || name.includes('rounded')) {
    return 'radius';
  }
  if (name.includes('shadow')) {
    return 'shadow';
  }
  if (name.includes('transition') || name.includes('duration') || name.includes('timing')) {
    return 'transition';
  }
  return 'other';
}

const CATEGORY_LABELS: Record<VariableCategory, string> = {
  color: '🎨 Colors',
  spacing: '📏 Spacing',
  typography: '🔤 Typography',
  radius: '⬜ Radius',
  shadow: '🌑 Shadows',
  transition: '⚡ Transitions',
  other: '📦 Other',
};

// =============================================================================
// Component
// =============================================================================

export function CSSVariableInspector() {
  const [variables, setVariables] = useState<CSSVariable[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<VariableCategory | 'all'>('all');
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const [editingVar, setEditingVar] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Extract CSS variables from document
  const extractVariables = useCallback(() => {
    const vars: CSSVariable[] = [];
    const style = getComputedStyle(document.documentElement);
    
    // Get all CSS custom properties from stylesheets
    const propertyNames = new Set<string>();
    
    // Check all stylesheets
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule && rule.selectorText === ':root') {
            for (const prop of rule.style) {
              if (prop.startsWith('--')) {
                propertyNames.add(prop);
              }
            }
          }
        }
      } catch {
        // CORS restriction - skip this stylesheet
      }
    }

    // Also check inline styles on :root
    const rootStyle = document.documentElement.style;
    for (let i = 0; i < rootStyle.length; i++) {
      const prop = rootStyle[i];
      if (prop.startsWith('--')) {
        propertyNames.add(prop);
      }
    }

    // Add common theme variables we know about
    const commonVars = [
      '--color-primary', '--color-secondary', '--color-accent',
      '--color-background', '--color-surface', '--color-text',
      '--color-text-muted', '--color-border', '--color-error',
      '--color-success', '--color-warning', '--color-info',
      '--radius-small', '--radius-medium', '--radius-large',
      '--spacing-xs', '--spacing-sm', '--spacing-md', '--spacing-lg',
      '--font-sans', '--font-mono', '--font-scale',
      '--transition-fast', '--transition-normal', '--transition-slow',
      '--shadow-sm', '--shadow-md', '--shadow-lg',
    ];
    commonVars.forEach(v => propertyNames.add(v));

    // Get computed values
    propertyNames.forEach(name => {
      const value = style.getPropertyValue(name).trim();
      if (value) {
        vars.push({
          name,
          value,
          category: categorizeVariable(name),
          computed: value,
        });
      }
    });

    // Sort alphabetically
    vars.sort((a, b) => a.name.localeCompare(b.name));
    
    setVariables(vars);
  }, []);

  // Extract on mount and watch for changes
  useEffect(() => {
    extractVariables();
    
    // Re-extract when attributes change
    const observer = new MutationObserver(() => {
      setTimeout(extractVariables, 100);
    });
    
    observer.observe(document.documentElement, { 
      attributes: true,
      attributeFilter: ['data-grade-band', 'data-high-contrast', 'style'],
    });
    
    return () => observer.disconnect();
  }, [extractVariables]);

  // Filter variables
  const filteredVariables = useMemo(() => {
    return variables.filter(v => {
      const matchesSearch = searchQuery === '' || 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.value.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || v.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [variables, searchQuery, selectedCategory]);

  // Group by category
  const groupedVariables = useMemo(() => {
    const groups: Record<VariableCategory, CSSVariable[]> = {
      color: [],
      spacing: [],
      typography: [],
      radius: [],
      shadow: [],
      transition: [],
      other: [],
    };

    filteredVariables.forEach(v => {
      groups[v.category].push(v);
    });

    return groups;
  }, [filteredVariables]);

  // Copy variable
  const copyVariable = useCallback(async (varName: string, format: 'name' | 'value' | 'usage') => {
    const variable = variables.find(v => v.name === varName);
    if (!variable) return;

    let text: string;
    switch (format) {
      case 'name':
        text = variable.name;
        break;
      case 'value':
        text = variable.value;
        break;
      case 'usage':
        text = `var(${variable.name})`;
        break;
    }

    await navigator.clipboard.writeText(text);
    setCopiedVar(varName);
    setTimeout(() => setCopiedVar(null), 2000);
  }, [variables]);

  // Edit variable
  const startEditing = useCallback((varName: string) => {
    const variable = variables.find(v => v.name === varName);
    if (variable) {
      setEditingVar(varName);
      setEditValue(variable.value);
    }
  }, [variables]);

  const applyEdit = useCallback(() => {
    if (!editingVar) return;
    
    document.documentElement.style.setProperty(editingVar, editValue);
    setEditingVar(null);
    setEditValue('');
    
    // Re-extract variables
    setTimeout(extractVariables, 100);
  }, [editingVar, editValue, extractVariables]);

  // Export all variables
  const exportVariables = useCallback(() => {
    const cssOutput = `:root {\n${
      variables.map(v => `  ${v.name}: ${v.value};`).join('\n')
    }\n}`;

    const blob = new Blob([cssOutput], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'theme-variables.css';
    a.click();
    URL.revokeObjectURL(url);
  }, [variables]);

  return (
    <div className="p-4 space-y-4">
      {/* Search & Filter */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Search variables..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500"
        />

        <div className="flex gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-2 py-1 text-xs rounded whitespace-nowrap transition-colors',
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
          >
            All ({variables.length})
          </button>
          {Object.entries(groupedVariables).map(([cat, vars]) => (
            vars.length > 0 && (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat as VariableCategory)}
                className={cn(
                  'px-2 py-1 text-xs rounded whitespace-nowrap transition-colors',
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                )}
              >
                {CATEGORY_LABELS[cat as VariableCategory].split(' ')[0]} {vars.length}
              </button>
            )
          ))}
        </div>
      </div>

      {/* Variables List */}
      <div className="space-y-4 max-h-[400px] overflow-auto">
        {selectedCategory === 'all' ? (
          // Grouped view
          Object.entries(groupedVariables).map(([category, vars]) => (
            vars.length > 0 && (
              <div key={category}>
                <h4 className="text-xs font-medium text-gray-400 mb-2 sticky top-0 bg-gray-900 py-1">
                  {CATEGORY_LABELS[category as VariableCategory]}
                </h4>
                <div className="space-y-1">
                  {vars.map(variable => (
                    <VariableRow
                      key={variable.name}
                      variable={variable}
                      isCopied={copiedVar === variable.name}
                      isEditing={editingVar === variable.name}
                      editValue={editValue}
                      onCopy={copyVariable}
                      onStartEdit={startEditing}
                      onEditChange={setEditValue}
                      onApplyEdit={applyEdit}
                      onCancelEdit={() => setEditingVar(null)}
                    />
                  ))}
                </div>
              </div>
            )
          ))
        ) : (
          // Flat view
          <div className="space-y-1">
            {filteredVariables.map(variable => (
              <VariableRow
                key={variable.name}
                variable={variable}
                isCopied={copiedVar === variable.name}
                isEditing={editingVar === variable.name}
                editValue={editValue}
                onCopy={copyVariable}
                onStartEdit={startEditing}
                onEditChange={setEditValue}
                onApplyEdit={applyEdit}
                onCancelEdit={() => setEditingVar(null)}
              />
            ))}
          </div>
        )}

        {filteredVariables.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No variables found
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-gray-700 flex gap-2">
        <button
          onClick={extractVariables}
          className="flex-1 px-3 py-2 text-xs font-medium rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
        >
          🔄 Refresh
        </button>
        <button
          onClick={exportVariables}
          className="flex-1 px-3 py-2 text-xs font-medium rounded bg-purple-600 text-white hover:bg-purple-500 transition-colors"
        >
          📥 Export CSS
        </button>
      </div>

      {/* Quick Reference */}
      <div className="pt-4 border-t border-gray-700">
        <h4 className="text-xs font-medium text-gray-300 mb-2">Usage Reference</h4>
        <div className="text-xs text-gray-400 font-mono bg-gray-800 p-2 rounded">
          <div>color: rgb(var(--color-primary));</div>
          <div>background: rgb(var(--color-bg) / 0.5);</div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-Components
// =============================================================================

interface VariableRowProps {
  variable: CSSVariable;
  isCopied: boolean;
  isEditing: boolean;
  editValue: string;
  onCopy: (name: string, format: 'name' | 'value' | 'usage') => void;
  onStartEdit: (name: string) => void;
  onEditChange: (value: string) => void;
  onApplyEdit: () => void;
  onCancelEdit: () => void;
}

function VariableRow({
  variable,
  isCopied,
  isEditing,
  editValue,
  onCopy,
  onStartEdit,
  onEditChange,
  onApplyEdit,
  onCancelEdit,
}: VariableRowProps) {
  const isColor = variable.category === 'color' && /^\d+\s+\d+\s+\d+/.test(variable.value);

  return (
    <div className={cn(
      'group p-2 rounded transition-colors',
      isEditing ? 'bg-purple-900/30' : 'hover:bg-gray-800'
    )}>
      {isEditing ? (
        <div className="space-y-2">
          <div className="text-xs font-mono text-purple-400">{variable.name}</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={editValue}
              onChange={e => onEditChange(e.target.value)}
              className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-mono text-white"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            <button
              onClick={onApplyEdit}
              className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-500"
            >
              ✓
            </button>
            <button
              onClick={onCancelEdit}
              className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              ✗
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {/* Color swatch */}
          {isColor && (
            <div
              className="w-4 h-4 rounded border border-gray-600 shrink-0"
              style={{ backgroundColor: `rgb(${variable.value})` }}
            />
          )}

          {/* Name & Value */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-mono text-gray-300 truncate">
              {variable.name}
            </div>
            <div className="text-[10px] font-mono text-gray-500 truncate">
              {variable.value}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isCopied ? (
              <span className="text-[10px] text-green-400">Copied!</span>
            ) : (
              <>
                <button
                  onClick={() => onCopy(variable.name, 'usage')}
                  className="p-1 text-gray-500 hover:text-white rounded"
                  title="Copy as var()"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => onStartEdit(variable.name)}
                  className="p-1 text-gray-500 hover:text-white rounded"
                  title="Edit"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
