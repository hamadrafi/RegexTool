import React, { useState, useCallback, useMemo } from 'react';
import { TEMPLATES } from './constants';
import { RegexTemplate, TestResult, DFAGraph } from './types';
import DFAVisualizer from './components/DFAVisualizer';
import { generateLocalDFA } from './dfaGenerator';

const App: React.FC = () => {
  const [pattern, setPattern] = useState(TEMPLATES[0].pattern);
  const [testInput, setTestInput] = useState('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [dfaGraph, setDfaGraph] = useState<DFAGraph | null>(null);
  const [isGeneratingDFA, setIsGeneratingDFA] = useState(false);
  const [activeTab, setActiveTab] = useState<'tester' | 'visualizer'>('tester');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isValidRegex = useMemo(() => {
    try {
      new RegExp(pattern);
      return true;
    } catch {
      return false;
    }
  }, [pattern]);

  const categories = useMemo(() => {
    const cats = new Set(TEMPLATES.map(t => t.category));
    return Array.from(cats);
  }, []);

  const filteredTemplates = useMemo(() => {
    return selectedCategory 
      ? TEMPLATES.filter(t => t.category === selectedCategory)
      : TEMPLATES;
  }, [selectedCategory]);

  const handleTest = useCallback(async () => {
    if (!isValidRegex) return;
    try {
      const regex = new RegExp(pattern);
      const lines = testInput.split('\n').filter(l => l.trim() !== '');
      const newResults: TestResult[] = lines.map(line => ({
        input: line,
        isMatch: regex.test(line),
        timestamp: Date.now()
      }));
      setResults(newResults);
    } catch (e) {
      console.error("Regex execution failed", e);
    }
  }, [pattern, testInput, isValidRegex]);

  const handleVisualize = useCallback(() => {
    if (!isValidRegex) return;
    setIsGeneratingDFA(true);
    setActiveTab('visualizer');
    
    setTimeout(() => {
      try {
        const graph = generateLocalDFA(pattern);
        setDfaGraph(graph);
      } catch (e) {
        console.error("Visualization error", e);
      } finally {
        setIsGeneratingDFA(false);
      }
    }, 400);
  }, [pattern, isValidRegex]);

  const loadTemplate = (template: RegexTemplate) => {
    setPattern(template.pattern);
    setResults([]);
    setDfaGraph(null);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar: Templates */}
      <aside className={`fixed lg:relative w-full sm:w-80 bg-slate-950 border-r border-slate-800 p-4 sm:p-8 flex-shrink-0 lg:h-screen overflow-y-auto z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter">Regex<span className="text-blue-500"> Tool</span></h1>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <nav className="space-y-6 sm:space-y-10">
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                Pattern Library
              </h2>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
              <button 
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${!selectedCategory ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
              >
                All
              </button>
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-500 hover:bg-slate-800'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className={`w-full text-left p-4 sm:p-5 rounded-2xl text-sm transition-all border group relative overflow-hidden ${
                    pattern === t.pattern 
                    ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20' 
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className={`font-black mb-1 transition-colors uppercase text-[11px] tracking-wider ${pattern === t.pattern ? 'text-blue-400' : 'text-slate-200'}`}>
                    {t.name}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                    {t.description}
                  </div>
                  {pattern === t.pattern && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500/20 text-2xl sm:text-3xl">
                      <i className="fas fa-check-circle"></i>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-screen lg:h-screen bg-[#080c14]">
        {/* Editor Toolbar */}
        <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 p-4 sm:p-6 lg:p-8 sticky top-0 z-30">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-slate-400 hover:text-white"
              >
                <i className="fas fa-bars text-xl"></i>
              </button>
              <h2 className="text-lg sm:text-2xl font-black tracking-tighter">Pattern Validator Platform</h2>
            </div>
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="flex-1 relative group">
                <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-700 font-mono text-lg sm:text-xl pointer-events-none group-focus-within:text-blue-500 transition-colors">/</div>
                <input
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  spellCheck={false}
                  className={`w-full bg-slate-900 border-2 ${isValidRegex ? 'border-slate-800 focus:border-blue-500/40' : 'border-rose-500/40 focus:border-rose-500/60'} rounded-2xl sm:rounded-[2rem] py-3 sm:py-5 px-8 sm:px-12 font-mono text-sm sm:text-lg outline-none transition-all shadow-2xl placeholder-slate-800 text-blue-50`}
                  placeholder="Enter regular expression..."
                />
                <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-slate-700 font-mono text-lg sm:text-xl pointer-events-none group-focus-within:text-blue-500 transition-colors">/g</div>
              </div>
              <div className="flex gap-3 sm:gap-4 shrink-0">
                <button 
                  onClick={handleVisualize}
                  disabled={!isValidRegex}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white font-black px-4 sm:px-8 py-3 sm:py-5 rounded-2xl sm:rounded-[2rem] transition-all flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-20 disabled:grayscale shadow-xl shadow-blue-900/20 active:scale-95 text-sm sm:text-base"
                >
                  <i className={`fas ${isGeneratingDFA ? 'fa-spinner fa-spin' : 'fa-project-diagram'}`}></i>
                  <span className="hidden sm:inline">Visualize States</span>
                  <span className="sm:hidden">Visualize</span>
                </button>
              </div>
            </div>
            {!isValidRegex && (
              <div className="flex items-center gap-2 sm:gap-3 text-rose-400 text-[9px] sm:text-[10px] font-black bg-rose-500/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-500/20 uppercase tracking-widest animate-pulse">
                <i className="fas fa-triangle-exclamation text-base sm:text-lg"></i>
                Invalid regex syntax detected
              </div>
            )}
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800/80 px-4 sm:px-8 lg:px-12 bg-slate-950/40 overflow-x-auto">
          <TabButton 
            active={activeTab === 'tester'} 
            onClick={() => setActiveTab('tester')} 
            label="Pattern Analysis" 
            icon="fa-vials" 
            color="text-blue-400" 
            borderColor="bg-blue-500"
          />
          <TabButton 
            active={activeTab === 'visualizer'} 
            onClick={() => setActiveTab('visualizer')} 
            label="Automata Graph" 
            icon="fa-network-wired" 
            color="text-emerald-400" 
            borderColor="bg-emerald-500"
          />
        </div>

        {/* Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'tester' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                <div className="space-y-4 sm:space-y-6">
                  <SectionLabel icon="fa-keyboard" color="text-blue-500" label="Input Buffers" info="One per line" />
                  <div className="relative">
                    <textarea
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      className="w-full h-[300px] sm:h-[400px] bg-slate-900/50 border-2 border-slate-800 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 font-mono text-xs sm:text-sm focus:border-blue-500/30 outline-none resize-none transition-all shadow-2xl backdrop-blur-sm placeholder-slate-800 text-slate-300"
                      placeholder="Paste test strings here..."
                    />
                  </div>
                  <button 
                    onClick={handleTest}
                    className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black py-4 sm:py-6 rounded-2xl sm:rounded-[2.5rem] shadow-2xl transition-all flex items-center justify-center gap-3 sm:gap-4 active:scale-[0.98] text-sm sm:text-base"
                  >
                    <i className="fas fa-play-circle text-lg sm:text-xl"></i>
                    Validate Patterns
                  </button>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <SectionLabel icon="fa-check-double" color="text-emerald-500" label="Matching Metrics" />
                    {results.length > 0 && (
                      <button 
                        onClick={() => setResults([])}
                        className="text-[9px] font-black uppercase text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="bg-slate-900/40 border-2 border-slate-800/80 rounded-2xl sm:rounded-[2.5rem] h-[400px] sm:h-[480px] overflow-y-auto shadow-2xl backdrop-blur-sm divide-y divide-slate-800/50">
                    {results.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-700 p-6 sm:p-12 text-center space-y-4 sm:space-y-6 opacity-40">
                        <i className="fas fa-microscope text-4xl sm:text-6xl"></i>
                        <p className="text-xs sm:text-sm font-black uppercase tracking-widest">Awaiting execution data</p>
                      </div>
                    ) : (
                      results.map((res, i) => (
                        <div key={i} className="p-4 sm:p-6 group hover:bg-slate-800/20 transition-all space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                               <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 ${res.isMatch ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'}`}></div>
                               <span className="font-mono text-xs sm:text-sm text-slate-300 truncate font-bold">{res.input}</span>
                            </div>
                            <span className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap ${res.isMatch ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {res.isMatch ? 'Match' : 'Failed'}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'visualizer' && (
              <div className="animate-in zoom-in-95 duration-500">
                {isGeneratingDFA ? (
                  <div className="h-[400px] sm:h-[600px] flex flex-col items-center justify-center bg-slate-950/40 rounded-2xl sm:rounded-[3rem] border-2 border-slate-800/50 space-y-6 sm:space-y-8 shadow-2xl">
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                      <i className="fas fa-atom absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 text-xl sm:text-2xl"></i>
                    </div>
                    <div className="text-center px-4">
                      <h4 className="text-lg sm:text-xl font-black text-slate-200 uppercase tracking-widest">Compiling States</h4>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">Synthesizing deterministic logic...</p>
                    </div>
                  </div>
                ) : dfaGraph ? (
                  <DFAVisualizer graph={dfaGraph} title={`REGEX: /${pattern}/`} />
                ) : (
                  <div className="h-[400px] sm:h-[600px] flex flex-col items-center justify-center bg-slate-950/20 rounded-2xl sm:rounded-[3rem] border-2 border-dashed border-slate-800/40 text-slate-700 space-y-4 sm:space-y-6 px-4">
                    <i className="fas fa-project-diagram text-5xl sm:text-7xl opacity-10"></i>
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-black uppercase tracking-widest">Graph Ready</p>
                      <p className="text-xs sm:text-sm max-w-xs mx-auto text-slate-600 font-medium">Click "Visualize States" to generate the state machine transition map.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const TabButton = ({ active, onClick, label, icon, color, borderColor }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 sm:px-8 lg:px-10 py-4 sm:py-6 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${active ? color : 'text-slate-600 hover:text-slate-300'}`}
  >
    <div className="flex items-center gap-2 sm:gap-3">
      <i className={`fas ${icon}`}></i>
      <span className="hidden sm:inline">{label}</span>
    </div>
    {active && <div className={`absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 ${borderColor} rounded-t-full shadow-[0_-4px_12px_rgba(0,0,0,0.5)]`}></div>}
  </button>
);

const SectionLabel = ({ icon, color, label, info }: any) => (
  <div className="flex items-center justify-between px-2">
    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 sm:gap-3">
      <i className={`fas ${icon} ${color}`}></i>
      {label}
    </label>
    {info && <span className="text-[10px] font-mono text-slate-700 font-black">{info}</span>}
  </div>
);

export default App;