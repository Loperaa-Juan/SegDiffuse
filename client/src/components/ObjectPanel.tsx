import type { DetectedObject } from '../types/segmentation';

interface ObjectPanelProps {
  objects: DetectedObject[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDeselect: () => void;
}

export function ObjectPanel({ objects, selectedId, onSelect, onDeselect }: ObjectPanelProps) {
  const selectedObj = selectedId !== null ? objects.find((o) => o.id === selectedId) : null;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">
          Detected objects
        </p>
        <p className="text-zinc-400 text-sm">
          {objects.length} {objects.length === 1 ? 'object' : 'objects'} found
        </p>
      </div>

      {/* Object list */}
      <div className="flex flex-col gap-2 overflow-y-auto max-h-[520px] pr-0.5">
        {objects.map((obj) => {
          const isSelected = selectedId === obj.id;
          return (
            <button
              key={obj.id}
              onClick={() => (isSelected ? onDeselect() : onSelect(obj.id))}
              className={[
                'group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                'border transition-all duration-150',
                isSelected
                  ? 'border-zinc-600/80 bg-zinc-800/80'
                  : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/50',
              ].join(' ')}
              style={
                isSelected
                  ? { boxShadow: `0 0 0 1px ${obj.color.raw}44, 0 0 12px ${obj.color.raw}22` }
                  : {}
              }
            >
              {/* Color dot */}
              <span
                className="flex-shrink-0 w-3 h-3 rounded-full"
                style={{
                  backgroundColor: obj.color.raw,
                  boxShadow: isSelected ? `0 0 8px ${obj.color.raw}` : 'none',
                }}
              />

              {/* Class name + score */}
              <div className="flex-1 min-w-0">
                <p
                  className={[
                    'text-sm font-medium truncate capitalize',
                    isSelected ? 'text-zinc-100' : 'text-zinc-300',
                  ].join(' ')}
                >
                  {obj.className}
                </p>
                <p className="text-xs text-zinc-500">
                  {(obj.score * 100).toFixed(1)}% confidence
                </p>
              </div>

              {/* Selected badge */}
              {isSelected && (
                <span
                  className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                  style={{
                    backgroundColor: `${obj.color.raw}22`,
                    color: obj.color.raw,
                  }}
                >
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection action panel */}
      {selectedObj && (
        <div
          className="mt-auto rounded-xl border p-4 space-y-3 animate-slide-up"
          style={{
            borderColor: `${selectedObj.color.raw}44`,
            backgroundColor: `${selectedObj.color.raw}0d`,
          }}
        >
          <div className="flex items-start gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0"
              style={{ backgroundColor: selectedObj.color.raw }}
            />
            <div>
              <p className="text-sm font-semibold text-zinc-100 capitalize">
                {selectedObj.className}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Object ID #{selectedObj.id} · {(selectedObj.score * 100).toFixed(1)}% conf.
              </p>
            </div>
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium text-white transition-all duration-150 active:scale-[0.97]"
            style={{ backgroundColor: selectedObj.color.raw }}
            onClick={() => {
              // Placeholder: trigger inpainting with selectedObj.id
              alert(`Inpainting requested for object #${selectedObj.id} (${selectedObj.className})`);
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
            </svg>
            Inpaint this object
          </button>
        </div>
      )}
    </div>
  );
}
