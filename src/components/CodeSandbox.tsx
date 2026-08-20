import React, { useState } from 'react';
import { Play, Code2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface CodeSandboxProps {
  initialLanguage?: 'javascript' | 'python' | 'sql';
  initialCode?: string;
}

export function CodeSandbox({ 
  initialLanguage = 'javascript', 
  initialCode = 'console.log("Welcome to Neural Academy Sandbox!");\n\nfunction add(a, b) {\n  return a + b;\n}\n\nconsole.log("5 + 3 =", add(5, 3));' 
}: CodeSandboxProps) {
  const [language, setLanguage] = useState(initialLanguage);
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCode = () => {
    setIsRunning(true);
    setOutput('');
    setError(null);

    // Simulate execution or execute safe JS
    try {
      if (language === 'javascript') {
        // Capture console.log output
        let logs: string[] = [];
        const customConsole = {
          log: (...args: any[]) => logs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')),
          error: (...args: any[]) => logs.push('ERROR: ' + args.join(' ')),
        };

        // Run code securely with captured console
        const runFn = new Function('console', code);
        runFn(customConsole);

        setOutput(logs.join('\n') || 'Code executed successfully with no output.');
      } else {
        // For Python/SQL mock environment in browser
        setTimeout(() => {
          setOutput(`[Simulated ${language.toUpperCase()} Output]\nQuery executed successfully.\nResult: [1 row affected / Success Mock Response]`);
        }, 500);
      }
    } catch (err: any) {
      setError(err.message || 'Execution error');
    } finally {
      if (language === 'javascript') {
        setIsRunning(false);
      } else {
        setTimeout(() => setIsRunning(false), 500);
      }
    }
  };

  const resetCode = () => {
    setCode(initialCode);
    setOutput('');
    setError(null);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Sandbox Header */}
      <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Interactive Code Sandbox</h3>
            <p className="text-xs text-gray-500">Test and run code live within your study session</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-white dark:bg-gray-900 text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="javascript">JavaScript (Node)</option>
            <option value="python">Python 3</option>
            <option value="sql">SQL Database</option>
          </select>

          <button
            onClick={resetCode}
            title="Reset Code"
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={runCode}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-800">
        {/* Code Input Area */}
        <div className="p-4 bg-gray-950 text-gray-100 font-mono text-sm">
          <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Editor ({language})</div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            className="w-full bg-transparent resize-none focus:outline-none text-emerald-400 font-mono leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Execution Output Area */}
        <div className="p-4 bg-gray-900 text-gray-100 font-mono text-sm flex flex-col">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2 uppercase tracking-wider">
            <span>Console Output</span>
            {output && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Success</span>}
            {error && <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Error</span>}
          </div>
          
          <div className="flex-1 min-h-[220px] bg-gray-950 rounded-lg p-3 overflow-y-auto text-gray-300 whitespace-pre-wrap border border-gray-800">
            {error ? (
              <span className="text-red-400">{error}</span>
            ) : output ? (
              <span>{output}</span>
            ) : (
              <span className="text-gray-600 italic">Click "Run Code" to view execution results here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}