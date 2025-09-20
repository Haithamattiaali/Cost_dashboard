import React, { useState, useMemo, memo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import PlaygroundVisualization from '../components/PlaygroundVisualization';
import { DragDropProvider } from '../modules/drag-drop';
import { SortableVisualization } from '../modules/drag-drop';
import { GridWidth } from '../modules/grid-layout';
import { getGridClassName } from '../modules/grid-layout';
import { VirtualizedGrid } from '../modules/performance';

// Available dimensions for analysis
export const DIMENSIONS = [
  { value: 'type', label: 'Type' },
  { value: 'year', label: 'Year' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'gl_account_no', label: 'GL Account Number' },
  { value: 'gl_account_name', label: 'GL Account Name' },
  { value: 'gl_accounts_group', label: 'GL Accounts Group' },
  { value: 'cost_type', label: 'Cost Type' },
  { value: 'tco_model_categories', label: 'TCO Model Categories' },
  { value: 'main_categories', label: 'Main Categories' },
  { value: 'opex_capex', label: 'OpEx/CapEx' },
];

// Available measures for analysis
export const MEASURES = [
  { value: 'total_incurred_cost', label: 'Total Incurred Cost' },
  { value: 'value_wh', label: 'Warehouse Cost Value' },
  { value: 'value_trs', label: 'Transportation Cost Value' },
  { value: 'value_distribution', label: 'Distribution Cost Value' },
  { value: 'value_last_mile', label: 'Last Mile Cost Value' },
  { value: 'value_proceed_3pl_wh', label: 'PROCEED 3PL Warehouse Cost' },
  { value: 'value_proceed_3pl_trs', label: 'PROCEED 3PL Transportation Cost' },
];

// Chart types available
export const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
  { value: 'line', label: 'Line Chart', icon: '📈' },
];

export interface VisualizationConfig {
  id: string;
  dimension: string;
  measure?: string; // Keep for backward compatibility
  measures: string[]; // New: support multiple measures
  chartType: 'bar' | 'pie' | 'line';
  showTable: boolean;
  gridWidth: GridWidth;
}

export default function CostPlayground() {
  const [visualizations, setVisualizations] = useState<VisualizationConfig[]>([]);

  const addVisualization = () => {
    const newVisualization: VisualizationConfig = {
      id: `viz-${Date.now()}`,
      dimension: DIMENSIONS[0].value,
      measures: [MEASURES[0].value], // Initialize with single measure
      chartType: 'bar',
      showTable: true,
      gridWidth: visualizations.length === 0 ? 1 : 2, // Default to half width when multiple
    };

    setVisualizations([...visualizations, newVisualization]);
  };

  const removeVisualization = (id: string) => {
    setVisualizations(visualizations.filter(v => v.id !== id));
  };

  const updateVisualization = (id: string, updates: Partial<VisualizationConfig>) => {
    setVisualizations(visualizations.map(v =>
      v.id === id ? { ...v, ...updates } : v
    ));
  };

  // Handle drag-drop reordering
  const handleReorder = (newOrder: string[]) => {
    const orderedVisualizations = newOrder
      .map(id => visualizations.find(v => v.id === id))
      .filter(Boolean) as VisualizationConfig[];
    setVisualizations(orderedVisualizations);
  };

  // Extract visualization IDs for drag-drop
  const visualizationIds = useMemo(
    () => visualizations.map(v => v.id),
    [visualizations]
  );

  // Render a single visualization for drag overlay
  const renderDragOverlay = (activeId: string) => {
    const viz = visualizations.find(v => v.id === activeId);
    if (!viz) return null;

    return (
      <div className="shadow-2xl opacity-90">
        <MemoizedVisualization
          config={viz}
          onUpdate={() => {}}
          onRemove={() => {}}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visual Builder</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create custom visualizations to analyze your cost data
            </p>
          </div>
          <button
            onClick={addVisualization}
            className="inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors bg-gradient-to-r from-[#9e1f63] to-[#721548] text-white hover:from-[#721548] hover:to-[#9e1f63]"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Visualization
            {visualizations.length > 0 && (
              <span className="ml-2 text-sm opacity-90">
                ({visualizations.length})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Empty State */}
      {visualizations.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No visualizations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first custom visualization
            </p>
            <div className="mt-6">
              <button
                onClick={addVisualization}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#9e1f63] hover:bg-[#721548]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Visualization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visualization Grid with Drag-Drop */}
      {visualizations.length > 0 && (
        <DragDropProvider
          items={visualizationIds}
          onReorder={handleReorder}
          renderOverlay={renderDragOverlay}
          strategy="rect"
        >
          <div className="grid grid-cols-12 gap-6">
            {/* Use virtualization for > 10 visualizations */}
            {visualizations.length <= 10 ? (
              // Regular rendering for small numbers
              visualizations.map(viz => (
                <div key={viz.id} className={getGridClassName(viz.gridWidth)}>
                  <SortableVisualization id={viz.id}>
                    {(dragHandleProps) => (
                      <MemoizedVisualization
                        config={viz}
                        onUpdate={(updates) => updateVisualization(viz.id, updates)}
                        onRemove={() => removeVisualization(viz.id)}
                        dragHandleProps={dragHandleProps}
                      />
                    )}
                  </SortableVisualization>
                </div>
              ))
            ) : (
              // Virtualized rendering for large numbers
              <VirtualizedGrid
                items={visualizations}
                threshold={10}
                renderItem={(viz) => (
                  <div key={viz.id} className={getGridClassName(viz.gridWidth)}>
                    <SortableVisualization id={viz.id}>
                      {(dragHandleProps) => (
                        <MemoizedVisualization
                          config={viz}
                          onUpdate={(updates) => updateVisualization(viz.id, updates)}
                          onRemove={() => removeVisualization(viz.id)}
                          dragHandleProps={dragHandleProps}
                        />
                      )}
                    </SortableVisualization>
                  </div>
                )}
              />
            )}
          </div>
        </DragDropProvider>
      )}

      {/* Instructions */}
      {visualizations.length > 0 && (
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-[#9e1f63]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-[#721548]">
                <strong>Tips:</strong>
                • Drag visualizations to reorder them (hover to see drag handle)
                • Adjust each visualization's width using the layout controls
                • Create unlimited visualizations to analyze your data
                {visualizations.length > 10 && ' • Visualizations load as you scroll for better performance'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Memoized PlaygroundVisualization for better performance
const MemoizedVisualization = memo(PlaygroundVisualization);