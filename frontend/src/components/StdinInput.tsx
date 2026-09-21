interface StdinInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function StdinInput({ value, onChange }: StdinInputProps) {
  return (
    <div className="h-full w-full panel rounded-none border-none flex flex-col p-2 bg-[var(--bg-panel)]">
      <label className="text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1">Stdin</label>
      <textarea
        className="w-full flex-1 p-2 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md font-mono text-sm resize-none outline-none focus:border-[var(--accent)]"
        placeholder="Nhập dữ liệu đầu vào (stdin)..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

