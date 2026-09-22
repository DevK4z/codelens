import { Sample, SAMPLES } from '../data/samples';

interface SampleSelectorProps {
  onSelect: (sample: Sample) => void;
  currentCode?: string;
}

export function SampleSelector({ onSelect, currentCode }: SampleSelectorProps) {
  const currentSampleId = SAMPLES.find(s => s.code === currentCode)?.id || '';

  return (
    <select 
      className="px-3 py-2 bg-[var(--bg-panel)] border border-[var(--border)] rounded-md outline-none focus:border-[var(--accent)] text-sm max-w-[250px]"
      value={currentSampleId}
      onChange={(e) => {
        const sample = SAMPLES.find(s => s.id === e.target.value);
        if (sample) onSelect(sample);
      }}
    >
      <option value="" disabled>-- Chọn bài mẫu (Tùy chọn) --</option>
      {SAMPLES.map(sample => (
        <option key={sample.id} value={sample.id}>
          {sample.name} - {sample.description.substring(0, 30)}...
        </option>
      ))}
    </select>
  );
}

