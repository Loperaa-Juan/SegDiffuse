import type { DetectedObject } from '../types/segmentation';

interface ObjectPanelProps {
  objects: DetectedObject[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDeselect: () => void;
  onInpaint: (id: number) => void;
}

export function ObjectPanel({ objects, selectedId, onSelect, onDeselect, onInpaint }: ObjectPanelProps) {
  const selectedObj = selectedId !== null ? objects.find((o) => o.id === selectedId) : null;
  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1">Detected objects</p>
        <p className="text-gray-600 dark:text-zinc-400 text-sm">{objects.length} {objects.length === 1 ? 'object' : 'objects'} found</p>
      </div>
      <div className="flex flex-col gap-2 md:overflow-y-auto md:max-h-[520px] pr-0.5">
        {objects.map((obj) => {
          const isSelected = selectedId === obj.id;
          return (
            <button
              key={obj.id}
              onClick={() => (isSelected ? onDeselect() : onSelect(obj.id))}
              className={[
                'group relative w-full flex items-center gap-3 px-3 rounded-xl text-left',
                'min-h-[44px] py-3',
                'border transition-all duration-150',
                isSelected
                  ? 'border-gray-300/80 dark:border-zinc-600/80 bg-gray-50 dark:bg-zinc-800/80'
                  : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-gray-200 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 active:border-gray-200 dark:active:border-zinc-700 active:bg-gray-50 dark:active:bg-zinc-800/50',
              ].join(' ')}
              style={isSelected ? { boxShadow: `0 0 0 1px ${obj.color.raw}44, 0 0 12px ${obj.color.raw}22` } : {}}
            >
              <span
                className="flex-shrink-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: obj.color.raw, boxShadow: isSelected ? `0 0 8px ${obj.color.raw}` : 'none' }}
              />
              <div className="flex-1 min-w-0">
                <p className={[
                  'text-sm font-medium truncate capitalize',
                  isSelected ? 'text-gray-900 dark:text-zinc-100' : 'text-gray-700 dark:text-zinc-300',
                ].join(' ')}>{obj.className}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{(obj.score * 100).toFixed(1)}% confidence</p>
              </div>
              {isSelected && (
                <span
                  className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                  style={{ backgroundColor: `${obj.color.raw}22`, color: obj.color.raw }}
                >
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
      {selectedObj && (
        <div
          className="mt-auto rounded-xl border p-4 space-y-3 animate-slide-up"
          style={{ borderColor: `${selectedObj.color.raw}44`, backgroundColor: `${selectedObj.color.raw}0d` }}
        >
          <div className="flex items-start gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0"
              style={{ backgroundColor: selectedObj.color.raw }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 capitalize">{selectedObj.className}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">Object ID #{selectedObj.id} · {(selectedObj.score * 100).toFixed(1)}% conf.</p>
            </div>
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 min-h-[44px] py-2.5 px-4 rounded-lg text-sm font-medium text-white transition-all duration-150 active:scale-[0.97]"
            style={{ backgroundColor: selectedObj.color.raw }}
            onClick={() => onInpaint(selectedObj.id)}
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
