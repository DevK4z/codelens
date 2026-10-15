import { useEffect, useRef, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  theme: 'dark' | 'light';
  currentLine?: number;
  executionStep?: number;
  error?: string | null;
}

export function CodeEditor({ code, onChange, theme, currentLine, executionStep, error: _error }: CodeEditorProps) {
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const [followStep, setFollowStep] = useState(true);
  const decorationsCollectionRef = useRef<any>(null);

  useEffect(() => {
    if (monaco && decorationsCollectionRef.current) {
      if (currentLine) {
        decorationsCollectionRef.current.set([{
          range: new monaco.Range(currentLine, 1, currentLine, 1),
          options: {
            isWholeLine: true,
            className: 'highlight-line',
          }
        }]);
        if (followStep) editorRef.current?.revealLineInCenterIfOutsideViewport(currentLine);
      } else {
        decorationsCollectionRef.current.set([]);
      }
    }
  }, [monaco, currentLine, executionStep, followStep]);

  const handleEditorDidMount = (editor: any, api: any) => {
    editorRef.current = editor;
    decorationsCollectionRef.current = editor.createDecorationsCollection(currentLine ? [{
      range: new api.Range(currentLine, 1, currentLine, 1),
      options: { isWholeLine: true, className: 'highlight-line' }
    }] : []);
    if (currentLine && followStep) editor.revealLineInCenterIfOutsideViewport(currentLine);
  };

  return (
    <div className="h-full w-full panel flex flex-col relative border-none rounded-none border-b border-[var(--border)] bg-transparent">
      <label className="flex items-center gap-2 px-3 py-1 text-xs text-[var(--text-secondary)] shrink-0">
        <input type="checkbox" checked={followStep} onChange={event => setFollowStep(event.target.checked)} />
        Tự cuộn theo bước chạy
      </label>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language="cpp"
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={code}
          onChange={(val) => onChange(val || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: 'off',
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            readOnly: false
          }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
}

