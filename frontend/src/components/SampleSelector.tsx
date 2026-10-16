import { Sample, SAMPLES } from '../data/samples';

interface SampleSelectorProps {
  onSelect: (sample: Sample) => void;
  currentCode?: string;
}

export function SampleSelector({ onSelect, currentCode }: SampleSelectorProps) {
  // Selecting a sample opens a read-only preview, never edits the main draft.
  void currentCode;

  return (
    <select aria-label="Chọn bài mẫu"
      className="px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] text-sm max-w-[250px]"
      value=""
      onChange={(e) => {
        const sample = SAMPLES.find(s => s.id === e.target.value);
        if (sample) onSelect(sample);
      }}
    >
      <option value="" disabled>Xem trước mẫu nhanh…</option>
      {SAMPLES.map(sample => (
        <option key={sample.id} value={sample.id}>
          {sample.name} - {sample.description.substring(0, 30)}...
        </option>
      ))}
    </select>
  );
}

