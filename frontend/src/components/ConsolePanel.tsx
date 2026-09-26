interface ConsolePanelProps {
  stdout: string;
  compilationError?: string;
  runtimeError?: string;
  sandboxWarning?: string;
}

export function ConsolePanel({ stdout, compilationError, runtimeError, sandboxWarning }: ConsolePanelProps) {
  const hasAnyContent = stdout || compilationError || runtimeError || sandboxWarning;

  return (
    <div className="h-full w-full bg-[#1e1e1e] text-[#d4d4d4] p-4 overflow-auto font-mono text-sm leading-relaxed">
      {sandboxWarning && (
        <div className="text-yellow-400 mb-2 border-l-4 border-yellow-400 pl-2 py-1 bg-yellow-400 bg-opacity-10">
          ⚠️ {sandboxWarning}
        </div>
      )}
      {stdout && (
        <div className="whitespace-pre-wrap mb-2">{stdout}</div>
      )}
      {compilationError && (
        <div className="text-red-400 whitespace-pre-wrap mb-2">
          Lỗi biên dịch:
          {'\n'}{compilationError}
        </div>
      )}
      {runtimeError && (
        <div className="text-red-400 whitespace-pre-wrap mb-2">
          Lỗi runtime:
          {'\n'}{runtimeError}
        </div>
      )}
      {!hasAnyContent && (
        <div className="whitespace-pre-wrap">
          <span className="text-gray-500 italic">Không có dữ liệu đầu ra.</span>
        </div>
      )}
    </div>
  );
}
