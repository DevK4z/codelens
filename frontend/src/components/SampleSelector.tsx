import { Sample, SAMPLES } from '../data/samples';

interface SampleSelectorProps {
  onSelect: (sample: Sample) => void;
}

export function SampleSelector({ onSelect }: SampleSelectorProps) {
  return (
    <select 
      className="px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)]"
      onChange={(e) => {
        const sample = SAMPLES.find(s => s.id === e.target.value);
        if (sample) onSelect(sample);
      }}
      defaultValue=""
    >
      <option value="" disabled>Chọn bài mẫu...</option>
      {SAMPLES.map(sample => (
        <option key={sample.id} value={sample.id}>
          {sample.name} - {sample.description.substring(0, 30)}...
        </option>
      ))}
    </select>
  );
}

