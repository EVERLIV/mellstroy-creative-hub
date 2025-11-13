import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = React.memo(({ viewMode, setViewMode }) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
      <button
        onClick={() => setViewMode('grid')}
        className={`p-1.5 rounded-md transition-all duration-200 ${
          viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`p-1.5 rounded-md transition-all duration-200 ${
          viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
});

ViewToggle.displayName = 'ViewToggle';

export default ViewToggle;
