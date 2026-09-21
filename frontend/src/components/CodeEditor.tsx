import { useEffect, useRef } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  theme: 'dark' | 'light';
  currentLine?: number;
  error?: string | null;
}

export function CodeEditor({ code, onChange, theme, currentLine, error: _error }: CodeEditorProps) {
  const monaco = useMonaco();
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
      } else {
        decorationsCollectionRef.current.set([]);
      }
    }
  }, [monaco, currentLine]);

  const handleEditorDidMount = (editor: any) => {
    decorationsCollectionRef.current = editor.createDecorationsCollection();
  };

  return (
    <div className="h-full w-full panel flex flex-col relative border-none rounded-none border-b border-[var(--border)] bg-transparent">
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

