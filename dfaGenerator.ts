
import { DFAGraph, DFAState, DFATransition } from './types';

/**
 * A more sophisticated representative DFA generator.
 * It builds a trie-like structure from regex branches to visualize 
 * a "minimized" state machine where common prefixes are shared.
 */
export function generateLocalDFA(pattern: string): DFAGraph {
  // Remove anchors for processing
  const cleanPattern = pattern.replace(/^\^/, '').replace(/\$$/, '');
  
  const states: DFAState[] = [
    { id: 'start', isInitial: true, isAccepting: false }
  ];
  const transitions: DFATransition[] = [];
  
  // Split into branches for 'OR' operations
  const branches = cleanPattern.split('|').filter(b => b.length > 0);
  
  let stateCounter = 1;

  branches.forEach((branch, bIdx) => {
    const tokens = tokenizeRegex(branch);
    let currentStateId = 'start';

    tokens.forEach((token, tIdx) => {
      const isLast = tIdx === tokens.length - 1;
      
      // Look for an existing transition from current state with the same label
      // This implements "prefix merging" (trie logic) for the DFA look.
      const existingTransition = transitions.find(
        tr => tr.from === currentStateId && tr.label === token
      );

      if (existingTransition) {
        currentStateId = existingTransition.to;
        // If this branch ends here, mark the existing state as accepting
        if (isLast) {
          const state = states.find(s => s.id === currentStateId);
          if (state) state.isAccepting = true;
        }
      } else {
        // Create a new state
        const newStateId = isLast ? `accept_${bIdx}_${tIdx}` : `s_${stateCounter++}`;
        states.push({
          id: newStateId,
          isInitial: false,
          isAccepting: isLast
        });
        
        transitions.push({
          from: currentStateId,
          to: newStateId,
          label: token.length > 12 ? token.substring(0, 10) + '...' : token
        });

        // Handle quantifiers for repetition loops
        if (token.includes('*') || token.includes('+')) {
          transitions.push({
            from: newStateId,
            to: newStateId,
            label: token.replace(/[*+?]/g, '')
          });
        }

        currentStateId = newStateId;
      }
    });
  });

  // Limit complexity for UX/Performance
  return { 
    states: states.slice(0, 25), 
    transitions: transitions.filter(t => 
      states.some(s => s.id === t.from) && states.some(s => s.id === t.to)
    )
  };
}

function tokenizeRegex(pattern: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  
  while (i < pattern.length) {
    let char = pattern[i];
    let token = char;

    if (char === '[') {
      const end = findMatchingBracket(pattern, i, '[', ']');
      token = pattern.substring(i, end + 1);
      i = end;
    } else if (char === '(') {
      const end = findMatchingBracket(pattern, i, '(', ')');
      token = pattern.substring(i, end + 1);
      i = end;
    } else if (char === '\\') {
      token = pattern.substring(i, i + 2);
      i++;
    }

    // Look ahead for quantifiers
    if (i + 1 < pattern.length && ['*', '+', '?', '{'].includes(pattern[i+1])) {
      if (pattern[i+1] === '{') {
        const end = pattern.indexOf('}', i + 1);
        if (end !== -1) {
          token += pattern.substring(i + 1, end + 1);
          i = end;
        }
      } else {
        token += pattern[i+1];
        i++;
      }
    }

    tokens.push(token);
    i++;
    if (tokens.length > 10) break; // Branch depth limit
  }
  return tokens;
}

function findMatchingBracket(str: string, start: number, open: string, close: string): number {
  let count = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === open) count++;
    else if (str[i] === close) count--;
    if (count === 0) return i;
  }
  return str.length - 1;
}
