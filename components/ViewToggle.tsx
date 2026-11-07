import React from 'react';
import { LayoutGrid, List, Map as MapIcon } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/src/components/ui/toggle-group';

type BaseMode = 'grid' | 'list';
type ExtendedMode = BaseMode | 'map';

interface ViewToggleProps {
  viewMode: ExtendedMode;
  setViewMode: (mode: any) => void;
  /** Include map option (Classes page). */
  withMap?: boolean;
}

const ViewToggle: React.FC<ViewToggleProps> = React.memo(
  ({ viewMode, setViewMode, withMap = false }) => (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={viewMode}
      onValueChange={(value) => {
        if (!value) return;
        if (value === 'grid' || value === 'list' || (withMap && value === 'map')) {
          setViewMode(value);
        }
      }}
      aria-label="View mode"
    >
      <ToggleGroupItem value="grid" aria-label="Card view" className="px-2.5">
        <LayoutGrid />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label="List view" className="px-2.5">
        <List />
      </ToggleGroupItem>
      {withMap ? (
        <ToggleGroupItem value="map" aria-label="Map view" className="px-2.5">
          <MapIcon />
        </ToggleGroupItem>
      ) : null}
    </ToggleGroup>
  )
);

ViewToggle.displayName = 'ViewToggle';

export default ViewToggle;
