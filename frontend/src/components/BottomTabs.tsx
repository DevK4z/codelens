import { useState } from 'react';
import { Database, Layers, Lightbulb, Terminal } from 'lucide-react';
import { TraceEvent, VariableRoleMap, VariableRole } from '../engine/types';
import { VariablePanel } from './VariablePanel';
import { CallStackPanel } from './CallStackPanel';
import { ConsolePanel } from './ConsolePanel';
import { ExplanationPanel } from './ExplanationPanel';

interface BottomTabsProps {
  event: TraceEvent | null;
  prevEvent: TraceEvent | null;
  variableRoles: VariableRoleMap;
  onRoleChange: (varName: string, role: VariableRole) => void;
  stdout: string;
  compilationError?: string;
  runtimeError?: string;
  sandboxWarning?: string;
  code: string;
}

type TabType = 'vars' | 'callstack' | 'explanation' | 'console';

export function BottomTabs({ 
  event, prevEvent, variableRoles, onRoleChange,
  stdout, compilationError, runtimeError, sandboxWarning, code
}: BottomTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('vars');

  const tabs = [
    { id: 'vars', label: 'Biến', icon: <Database size={16} /> },
    { id: 'callstack', label: 'Call Stack', icon: <Layers size={16} /> },
    { id: 'explanation', label: 'Giải thích', icon: <Lightbulb size={16} /> },
    { id: 'console', label: 'Console', icon: <Terminal size={16} /> },
  ];

  return (
    <div className="h-[250px] min-h-[150px] max-h-[500px] flex flex-col border-t border-[var(--border)] bg-[var(--bg-panel)] relative z-10">
      <div className="flex bg-[var(--bg-secondary)] border-b border-[var(--border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--bg-panel)]' 
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'vars' && <VariablePanel event={event} variableRoles={variableRoles} onRoleChange={onRoleChange} />}
        {activeTab === 'callstack' && <CallStackPanel event={event} />}
        {activeTab === 'explanation' && <ExplanationPanel event={event} prevEvent={prevEvent} code={code} stdout={stdout} />}
        {activeTab === 'console' && (
          <ConsolePanel 
            stdout={stdout} 
            compilationError={compilationError} 
            runtimeError={runtimeError} 
            sandboxWarning={sandboxWarning} 
          />
        )}
      </div>
    </div>
  );
}
