
export interface RegexTemplate {
  id: string;
  name: string;
  pattern: string;
  description: string;
  category: 'Communication' | 'Identification' | 'Security' | 'Web';
}

export interface DFAState {
  id: string;
  isAccepting: boolean;
  isInitial: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface DFATransition {
  from: string;
  to: string;
  label: string;
}

export interface DFAGraph {
  states: DFAState[];
  transitions: DFATransition[];
}

export interface TestResult {
  input: string;
  isMatch: boolean;
  timestamp: number;
}
