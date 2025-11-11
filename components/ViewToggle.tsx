import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex items-center space-x-1 bg-gray-200 p-1 rounded-lg">
      <button
        onClick={() => setViewMode('grid')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'grid' ? 'bg-white shadow-sm text-[#FF6B35]' : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="Grid view"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'list' ? 'bg-white shadow-sm text-[#FF6B35]' : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="List view"
      >
        <List className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ViewToggle;