'use client';

/**
 * ComponentGallery - Preview all UI components in current theme
 */

import { useState, useCallback } from 'react';
import { cn } from '../../utils';

// Import components for preview
import { Button } from '../Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../Card';
import { Input } from '../Input';
import { Badge, BadgeGroup } from '../Badge';
import { Progress } from '../Progress';
import { Alert, AlertTitle, AlertDescription } from '../Alert';

// =============================================================================
// Types
// =============================================================================

type ComponentCategory = 'all' | 'buttons' | 'forms' | 'feedback' | 'layout';
type ViewMode = 'single' | 'compare';
type GradeBand = 'k_5' | '6_8' | '9_12';

interface ComponentDemo {
  id: string;
  name: string;
  category: ComponentCategory;
  render: () => React.ReactNode;
}

// =============================================================================
// Component Demos
// =============================================================================

const COMPONENT_DEMOS: ComponentDemo[] = [
  // Buttons
  {
    id: 'button-primary',
    name: 'Primary Button',
    category: 'buttons',
    render: () => (
      <div className="flex flex-wrap gap-2">
        <Button intent="primary" size="sm">Small</Button>
        <Button intent="primary" size="md">Medium</Button>
        <Button intent="primary" size="lg">Large</Button>
      </div>
    ),
  },
  {
    id: 'button-variants',
    name: 'Button Variants',
    category: 'buttons',
    render: () => (
      <div className="flex flex-wrap gap-2">
        <Button intent="primary">Primary</Button>
        <Button intent="secondary">Secondary</Button>
        <Button intent="ghost">Ghost</Button>
        <Button intent="danger">Danger</Button>
        <Button intent="success">Success</Button>
      </div>
    ),
  },
  {
    id: 'button-states',
    name: 'Button States',
    category: 'buttons',
    render: () => (
      <div className="flex flex-wrap gap-2">
        <Button intent="primary">Normal</Button>
        <Button intent="primary" isLoading loadingText="Loading...">Loading</Button>
        <Button intent="primary" isDisabled>Disabled</Button>
      </div>
    ),
  },
  // Forms
  {
    id: 'input-basic',
    name: 'Basic Input',
    category: 'forms',
    render: () => (
      <div className="space-y-3 max-w-xs">
        <Input label="Name" placeholder="Enter your name" />
        <Input label="Email" type="email" placeholder="email@example.com" />
        <Input label="Password" type="password" placeholder="••••••••" />
      </div>
    ),
  },
  {
    id: 'input-states',
    name: 'Input States',
    category: 'forms',
    render: () => (
      <div className="space-y-3 max-w-xs">
        <Input label="Normal" placeholder="Normal input" />
        <Input label="With Error" error="This field is required" />
        <Input label="With Hint" hint="Enter at least 8 characters" />
        <Input label="Disabled" isDisabled defaultValue="Disabled input" />
      </div>
    ),
  },
  // Feedback
  {
    id: 'badge-variants',
    name: 'Badge Variants',
    category: 'feedback',
    render: () => (
      <div className="flex flex-wrap gap-2">
        <Badge>Default</Badge>
        <Badge intent="primary">Primary</Badge>
        <Badge intent="success">Success</Badge>
        <Badge intent="warning">Warning</Badge>
        <Badge intent="error">Error</Badge>
        <Badge intent="info">Info</Badge>
      </div>
    ),
  },
  {
    id: 'badge-group',
    name: 'Badge Group',
    category: 'feedback',
    render: () => (
      <BadgeGroup aria-label="Skills">
        <Badge intent="primary">React</Badge>
        <Badge intent="primary">TypeScript</Badge>
        <Badge intent="primary">Node.js</Badge>
        <Badge intent="primary" isRemovable onRemove={() => {}}>Removable</Badge>
      </BadgeGroup>
    ),
  },
  {
    id: 'progress-variants',
    name: 'Progress Bar',
    category: 'feedback',
    render: () => (
      <div className="space-y-4 max-w-xs">
        <Progress value={25} aria-label="Getting started" showLabel />
        <Progress value={50} aria-label="Halfway there" showLabel intent="primary" />
        <Progress value={75} aria-label="Almost done" showLabel intent="warning" />
        <Progress value={100} aria-label="Complete!" showLabel intent="success" />
      </div>
    ),
  },
  {
    id: 'alert-variants',
    name: 'Alert Variants',
    category: 'feedback',
    render: () => (
      <div className="space-y-3">
        <Alert intent="info">
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>This is an informational alert message.</AlertDescription>
        </Alert>
        <Alert intent="success">
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>Your changes have been saved successfully.</AlertDescription>
        </Alert>
        <Alert intent="warning">
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>Please review your input before continuing.</AlertDescription>
        </Alert>
        <Alert intent="error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong. Please try again.</AlertDescription>
        </Alert>
      </div>
    ),
  },
  // Layout
  {
    id: 'card-basic',
    name: 'Basic Card',
    category: 'layout',
    render: () => (
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Lesson Title</CardTitle>
          <CardDescription>Learn the basics of mathematics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            This lesson covers fundamental concepts that will help you build a strong foundation.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Badge intent="primary">Math</Badge>
          <Button size="sm">Start Lesson</Button>
        </CardFooter>
      </Card>
    ),
  },
  {
    id: 'card-variants',
    name: 'Card Variants',
    category: 'layout',
    render: () => (
      <div className="grid grid-cols-2 gap-3">
        <Card variant="elevated" padding="sm">
          <CardContent>Elevated</CardContent>
        </Card>
        <Card variant="outlined" padding="sm">
          <CardContent>Outlined</CardContent>
        </Card>
        <Card variant="filled" padding="sm">
          <CardContent>Filled</CardContent>
        </Card>
        <Card isInteractive padding="sm" onClick={() => {}}>
          <CardContent>Interactive</CardContent>
        </Card>
      </div>
    ),
  },
];

// =============================================================================
// Component
// =============================================================================

export function ComponentGallery() {
  const [category, setCategory] = useState<ComponentCategory>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [compareThemes, setCompareThemes] = useState<GradeBand[]>(['k_5', '6_8', '9_12']);

  // Filter components by category
  const filteredDemos = category === 'all'
    ? COMPONENT_DEMOS
    : COMPONENT_DEMOS.filter(demo => demo.category === category);

  // Export screenshot (simplified - would need html2canvas for real implementation)
  const exportScreenshot = useCallback(async () => {
    alert('Screenshot export would require html2canvas library. This is a placeholder.');
  }, []);

  return (
    <div className="p-4 space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Category Filter */}
        <div className="flex gap-1 overflow-x-auto">
          {(['all', 'buttons', 'forms', 'feedback', 'layout'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap transition-colors',
                category === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              )}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* View Mode */}
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('single')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'single'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
            title="Single view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('compare')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'compare'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            )}
            title="Compare themes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Compare Mode Theme Selector */}
      {viewMode === 'compare' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Compare:</span>
          {(['k_5', '6_8', '9_12'] as const).map(theme => (
            <label key={theme} className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={compareThemes.includes(theme)}
                onChange={e => {
                  if (e.target.checked) {
                    setCompareThemes([...compareThemes, theme]);
                  } else {
                    setCompareThemes(compareThemes.filter(t => t !== theme));
                  }
                }}
                className="rounded border-gray-600 bg-gray-700 text-purple-500"
              />
              <span className="text-gray-300">
                {theme === 'k_5' ? 'K-5' : theme === '6_8' ? '6-8' : '9-12'}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Component Grid */}
      <div className="space-y-6">
        {filteredDemos.map(demo => (
          <div key={demo.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-300">{demo.name}</h4>
              <span className="text-[10px] text-gray-500 uppercase">{demo.category}</span>
            </div>

            {viewMode === 'single' ? (
              <div className="p-4 bg-white rounded-lg border border-gray-700">
                <>{demo.render()}</>
              </div>
            ) : (
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${compareThemes.length}, 1fr)` }}>
                {compareThemes.map(theme => (
                  <div
                    key={theme}
                    data-grade-band={theme}
                    className="p-3 rounded-lg border border-gray-700"
                    style={{
                      backgroundColor: theme === 'k_5' 
                        ? 'rgb(254 252 232)' 
                        : theme === '6_8' 
                        ? 'rgb(248 250 252)' 
                        : 'rgb(255 255 255)'
                    }}
                  >
                    <div className="text-[10px] text-gray-500 mb-2 font-medium">
                      {theme === 'k_5' ? 'Elementary' : theme === '6_8' ? 'Middle' : 'High School'}
                    </div>
                    <div className="transform scale-90 origin-top-left">
                      <>{demo.render()}</>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Export */}
      <div className="pt-4 border-t border-gray-700">
        <button
          onClick={exportScreenshot}
          className="w-full px-4 py-2 text-sm font-medium rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
        >
          📸 Export Gallery Screenshot
        </button>
      </div>

      {/* Stats */}
      <div className="pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          Showing {filteredDemos.length} of {COMPONENT_DEMOS.length} components
        </div>
      </div>
    </div>
  );
}
