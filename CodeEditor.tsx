import { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { Check, Copy, RotateCcw, Play, Square, Terminal } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CodeEditorProps {
  initialCode: string;
  language?: string;
  storageKey?: string;
}

const MONACO_LANGUAGE_MAP: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  js: 'javascript',
  java: 'java',
  cpp: 'cpp',
  cplusplus: 'cpp',
  sql: 'sql',
};

const PISTON_LANGUAGE_MAP: Record<string, string> = {
  python: 'python',
  javascript: 'javascript',
  js: 'javascript',
  java: 'java',
  cpp: 'cpp',
  cplusplus: 'cpp',
};

const RUNNABLE_LANGUAGES = new Set(['python', 'javascript', 'js', 'java', 'cpp', 'cplusplus']);

const LANGUAGE_LABELS: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
  js: 'JavaScript',
  java: 'Java',
  cpp: 'C++',
  cplusplus: 'C++',
  sql: 'SQL',
};

interface RunResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  signal: string | null;
  exitCode: number | null;
}

export default function CodeEditor({ initialCode, language = 'js', storageKey }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [savedCode, setSavedCode] = useState(initialCode);
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const monacoLang = MONACO_LANGUAGE_MAP[language] ?? 'plaintext';
  const pistonLang = PISTON_LANGUAGE_MAP[language];
  const isRunnable = pistonLang ? RUNNABLE_LANGUAGES.has(language) : false;
  const langLabel = LANGUAGE_LABELS[language] ?? language;

  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        setCode(stored);
        setSavedCode(stored);
      }
    }
  }, [storageKey]);

  function handleEditorMount(editor: Parameters<OnMount>[0]) {
    editorRef.current = editor;
    editor.focus();
  }

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setCode(initialCode);
    setSavedCode(initialCode);
    if (storageKey) localStorage.removeItem(storageKey);
    setRunResult(null);
    setTerminalOpen(false);
    editorRef.current?.setValue(initialCode);
  }

  function handleEditorChange(value: string | undefined) {
    const next = value ?? '';
    setCode(next);
    if (storageKey && next !== savedCode) {
      localStorage.setItem(storageKey, next);
    }
  }

  async function run() {
    if (!pistonLang || running) return;
    setRunning(true);
    setTerminalOpen(true);
    setRunResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('run-code', {
        body: { language: pistonLang, code },
      });

      if (error) throw error;

      if (data?.output) {
        setRunResult({
          stdout: data.output.stdout ?? '',
          stderr: data.output.stderr ?? '',
          compileOutput: data.output.compileOutput ?? '',
          signal: data.signal ?? null,
          exitCode: data.exitCode ?? null,
        });
      } else if (data?.error) {
        setRunResult({
          stdout: '',
          stderr: data.error,
          compileOutput: '',
          signal: null,
          exitCode: null,
        });
      }
    } catch (err) {
      setRunResult({
        stdout: '',
        stderr: err instanceof Error ? err.message : 'Failed to run code. Please try again.',
        compileOutput: '',
        signal: null,
        exitCode: null,
      });
    } finally {
      setRunning(false);
    }
  }

  function stopRun() {
    setRunning(false);
  }

  const hasOutput = runResult !== null;
  const combinedOutput = [
    runResult?.compileOutput?.trim(),
    runResult?.stdout,
    runResult?.stderr,
  ].filter(Boolean);

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-2">
            {langLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copy}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="h-64 bg-slate-900">
        <Editor
          height="100%"
          language={monacoLang}
          value={code}
          theme="vs-dark"
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 4,
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
            fontLigatures: true,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            renderLineHighlight: 'all',
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>

      {/* Terminal output box */}
      {(terminalOpen || hasOutput) && (
        <div className="border-t border-slate-700 bg-slate-950">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/60 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <Terminal className="w-3.5 h-3.5" />
              {running ? 'Running...' : hasOutput ? 'Output' : 'Terminal'}
            </div>
            <button
              onClick={() => setTerminalOpen(false)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Hide
            </button>
          </div>
          <div className="p-4 min-h-[80px] max-h-48 overflow-y-auto scrollbar-thin">
            {running ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
                <span className="w-3.5 h-3.5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" />
                Compiling and running {langLabel}...
              </div>
            ) : hasOutput ? (
              <TerminalOutput result={runResult} />
            ) : (
              <p className="text-xs text-slate-600 font-mono">Click "Run code" to execute.</p>
            )}
          </div>
        </div>
      )}

      {/* Run button */}
      <div className="border-t border-slate-700 bg-slate-800 flex">
        {isRunnable ? (
          running ? (
            <button
              onClick={stopRun}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop
            </button>
          ) : (
            <button
              onClick={run}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Run code
            </button>
          )
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-500 text-xs font-medium">
            <Terminal className="w-3.5 h-3.5" />
            Live execution available for Python, JavaScript, Java, and C++
          </div>
        )}
      </div>
    </div>
  );
}

function TerminalOutput({ result }: { result: RunResult }) {
  const hasCompileError = result.compileOutput.trim().length > 0;
  const hasRunError = result.stderr.trim().length > 0;
  const hasStdout = result.stdout.trim().length > 0;
  const isError = hasCompileError || hasRunError;
  const success = !isError && result.exitCode === 0;

  return (
    <div className="space-y-2">
      {hasCompileError && (
        <div>
          <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">
            Compiler Output
          </p>
          <pre className="text-xs text-amber-300 font-mono whitespace-pre-wrap leading-relaxed">
            {result.compileOutput.trim()}
          </pre>
        </div>
      )}
      {hasStdout && (
        <div>
          <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            Output
          </p>
          <pre className="text-xs text-emerald-200 font-mono whitespace-pre-wrap leading-relaxed">
            {result.stdout}
          </pre>
        </div>
      )}
      {hasRunError && (
        <div>
          <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1">
            Error
          </p>
          <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap leading-relaxed">
            {result.stderr}
          </pre>
        </div>
      )}
      {!hasCompileError && !hasStdout && !hasRunError && (
        <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">
          Process exited with code {result.exitCode ?? '0'} (no output)
        </pre>
      )}
      <div className="flex items-center gap-3 pt-1 border-t border-slate-800 mt-2">
        <span className={`text-[10px] font-mono ${success ? 'text-emerald-500' : isError ? 'text-red-500' : 'text-slate-500'}`}>
          {success ? 'EXIT 0' : result.signal ? `SIGNAL ${result.signal}` : `EXIT ${result.exitCode ?? '?'}`}
        </span>
      </div>
    </div>
  );
}
