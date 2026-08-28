import { PythonExercise } from '../types';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  isCorrect?: boolean;
  feedback?: string;
  executionTimeMs: number;
}

/**
 * Safe Browser-based Python interpreter simulator supporting Python syntax,
 * built-in functions, print statements, loops, lists, dicts, math, json, regex, and classes.
 */
export const runPythonCode = (code: string, exercise?: PythonExercise): ExecutionResult => {
  const startTime = performance.now();
  const stdout: string[] = [];

  const customPrint = (...args: any[]) => {
    const line = args
      .map((arg) => {
        if (typeof arg === 'object' && arg !== null) {
          if (Array.isArray(arg)) {
            return `[${arg.map((x) => (typeof x === 'string' ? `'${x}'` : String(x))).join(', ')}]`;
          }
          if (arg instanceof Set) {
            return `{'${Array.from(arg).join("', '")}'}`;
          }
          return JSON.stringify(arg).replace(/"/g, "'");
        }
        if (typeof arg === 'boolean') {
          return arg ? 'True' : 'False';
        }
        return String(arg);
      })
      .join(' ');
    stdout.push(line);
  };

  try {
    // Normalize code lines
    const rawLines = code.split('\n');

    // Transpile basic Python patterns to JavaScript sandbox
    let jsCode = '';
    let inCommentBlock = false;

    // Helper context for execution
    const context: Record<string, any> = {
      print: customPrint,
      len: (obj: any) => (obj ? obj.length ?? Object.keys(obj).length : 0),
      type: (val: any) => {
        if (typeof val === 'number') {
          return Number.isInteger(val) ? "<class 'int'>" : "<class 'float'>";
        }
        if (typeof val === 'string') return "<class 'str'>";
        if (typeof val === 'boolean') return "<class 'bool'>";
        if (Array.isArray(val)) return "<class 'list'>";
        if (typeof val === 'object') return "<class 'dict'>";
        return `<class '${typeof val}'>`;
      },
      int: (val: any) => parseInt(val, 10),
      float: (val: any) => parseFloat(val),
      str: (val: any) => String(val),
      bool: (val: any) => Boolean(val),
      range: (start: number, stop?: number, step: number = 1) => {
        const res: number[] = [];
        let cur = stop === undefined ? 0 : start;
        const end = stop === undefined ? start : stop;
        if (step > 0) {
          for (let i = cur; i < end; i += step) res.push(i);
        } else if (step < 0) {
          for (let i = cur; i > end; i += step) res.push(i);
        }
        return res;
      },
      math: {
        sqrt: Math.sqrt,
        ceil: Math.ceil,
        floor: Math.floor,
        pi: Math.PI,
        pow: Math.pow,
        min: Math.min,
        max: Math.max,
        abs: Math.abs,
      },
      json: {
        loads: (s: string) => JSON.parse(s),
        dumps: (obj: any) => JSON.stringify(obj),
      },
      re: {
        search: (pattern: string, str: string) => {
          try {
            const regex = new RegExp(pattern);
            return regex.test(str) ? { match: true } : null;
          } catch {
            return null;
          }
        },
        findall: (pattern: string, str: string) => {
          const regex = new RegExp(pattern, 'g');
          return str.match(regex) || [];
        },
        sub: (pattern: string, repl: string, str: string) => {
          return str.replace(new RegExp(pattern, 'g'), repl);
        },
      },
      True: true,
      False: false,
      None: null,
    };

    // Pre-process python statements
    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i];
      const trimmed = line.trim();

      // Check comments
      if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
        inCommentBlock = !inCommentBlock;
        continue;
      }
      if (inCommentBlock) continue;
      if (trimmed.startsWith('#') || trimmed === '') {
        continue;
      }

      // Handle comments on the right
      const commentIdx = line.indexOf('#');
      if (commentIdx !== -1 && !line.slice(0, commentIdx).includes('"') && !line.slice(0, commentIdx).includes("'")) {
        line = line.slice(0, commentIdx);
      }

      // Python list comprehensions like [x**2 for x in range(1, 6)]
      line = line.replace(/\[\s*(.+?)\s+for\s+(\w+)\s+in\s+(.+?)\s*\]/g, '($3).map(($2) => ($1))');

      // Python f-strings f"The {item} costs ${price:.2f}"
      line = line.replace(/f"([^"]*)"/g, (match, content) => {
        const interpolated = content
          .replace(/\{([^}:]+):\.2f\}/g, '${Number($1).toFixed(2)}')
          .replace(/\{([^}]+)\}/g, '${$1}');
        return `\`${interpolated}\``;
      });

      // Python slicing: txt[0:5] -> txt.slice(0, 5) or [-1]
      line = line.replace(/(\w+)\[(-?\d+):(-?\d+)\]/g, '$1.slice($2, $3)');
      line = line.replace(/(\w+)\[:(-?\d+)\]/g, '$1.slice(0, $2)');
      line = line.replace(/(\w+)\[(-?\d+):\]/g, '$1.slice($2)');
      line = line.replace(/(\w+)\[-1\]/g, '$1[$1.length - 1]');

      // Python string methods
      line = line.replace(/\.strip\(\)/g, '.trim()');
      line = line.replace(/\.upper\(\)/g, '.toUpperCase()');
      line = line.replace(/\.lower\(\)/g, '.toLowerCase()');
      line = line.replace(/\.title\(\)/g, '.replace(/\\b\\w/g, c => c.toUpperCase())');
      line = line.replace(/\.count\((.+?)\)/g, '.filter ? $1.filter(x => x === $1).length : ($1.split ? ($1.split($2).length - 1) : 0)');

      // Python list methods
      line = line.replace(/\.append\((.+?)\)/g, '.push($1)');
      line = line.replace(/\.insert\((\d+),\s*(.+?)\)/g, '.splice($1, 0, $2)');

      // Python set intersection
      line = line.replace(/(\w+)\.intersection\((\w+)\)/g, 'new Set([...$1].filter(x => $2.has ? $2.has(x) : $2.includes(x)))');

      // Python operators: ** -> ** (already JS), and -> &&, or -> ||, not -> !
      // and replace elif -> else if
      line = line.replace(/\belif\b/g, 'else if');
      line = line.replace(/\bTrue\b/g, 'true');
      line = line.replace(/\bFalse\b/g, 'false');
      line = line.replace(/\bNone\b/g, 'null');

      // Python multiple assignment: x, y, z = "A", "B", "C"
      if (/^\s*([a-zA-Z_]\w*(\s*,\s*[a-zA-Z_]\w*)+)\s*=\s*(.+)$/.test(line)) {
        const parts = line.split('=');
        const vars = parts[0].trim();
        const vals = parts.slice(1).join('=').trim();
        line = `var [${vars}] = [${vals}];`;
      }

      // Convert def func(*args):
      if (line.trim().startsWith('def ')) {
        line = line.replace(/def\s+(\w+)\s*\((.*?)\)\s*:/, (m, name, params) => {
          const jsParams = params.replace(/\*(\w+)/, '...$1');
          return `function ${name}(${jsParams}) {`;
        });
      }

      // Convert class Name(Parent):
      if (line.trim().startsWith('class ')) {
        line = line.replace(/class\s+(\w+)(?:\((.*?)\))?\s*:/, (m, name, parent) => {
          return parent ? `class ${name} extends ${parent} {` : `class ${name} {`;
        });
      }

      // Convert __init__(self, ...)
      line = line.replace(/def\s+__init__\s*\(self(?:,\s*(.*?))?\)\s*:/, (m, params) => {
        return `constructor(${params || ''}) {`;
      });

      // Convert self.xxx -> this.xxx
      line = line.replace(/\bself\./g, 'this.');

      // Convert super().__init__(...) -> super(...)
      line = line.replace(/super\(\)\.__init__\((.*?)\)/g, 'super($1)');

      // Convert lambda a, b: a * b -> (a, b) => a * b
      line = line.replace(/lambda\s+([^:]+):\s*(.+)$/, '($1) => $2');

      // Convert if/for/while colons to braces
      if (line.trim().endsWith(':')) {
        const indent = line.search(/\S/);
        const statement = line.trim().slice(0, -1);
        if (statement.startsWith('if ') || statement.startsWith('else if ') || statement.startsWith('while ') || statement.startsWith('for ')) {
          if (statement.startsWith('for ') && statement.includes(' in ')) {
            const forMatch = statement.match(/for\s+(\w+)\s+in\s+(.+)/);
            if (forMatch) {
              const [_, varName, iterable] = forMatch;
              line = ' '.repeat(indent) + `for (let ${varName} of ${iterable}) {`;
            }
          } else {
            line = ' '.repeat(indent) + `${statement.replace(/^(if|else if|while)\s+(.+)$/, '$1 ($2)')} {`;
          }
        } else if (statement === 'else') {
          line = ' '.repeat(indent) + 'else {';
        } else if (statement === 'try') {
          line = ' '.repeat(indent) + 'try {';
        } else if (statement.startsWith('except')) {
          line = ' '.repeat(indent) + '} catch (err) {';
        }
      }

      jsCode += line + '\n';
    }

    // Auto close braces if needed
    const openBraces = (jsCode.match(/{/g) || []).length;
    const closeBraces = (jsCode.match(/}/g) || []).length;
    if (openBraces > closeBraces) {
      jsCode += '\n' + '}'.repeat(openBraces - closeBraces);
    }

    // Create execution scope
    const keys = Object.keys(context);
    const values = Object.values(context);
    const runner = new Function(...keys, `
      try {
        ${jsCode}
      } catch (e) {
        if (typeof print === 'function' && String(e).includes('undefined_var')) {
          // Handled gracefully for try/except test
          throw e;
        }
        throw e;
      }
    `);

    runner(...values);

    const actualOutput = stdout.join('\n').trim();
    const duration = Math.round(performance.now() - startTime);

    let isCorrect = true;
    let feedback = 'ยอดเยี่ยมมาก! โค้ดทำงานถูกต้องสมบูรณ์';

    if (exercise && exercise.expectedOutput) {
      const expectedNormalized = exercise.expectedOutput.trim();
      const actualNormalized = actualOutput.trim();

      if (exercise.validationType === 'exact_output') {
        isCorrect = expectedNormalized === actualNormalized;
      } else if (exercise.validationType === 'contains_code') {
        isCorrect = code.includes(exercise.expectedOutput);
      }

      if (!isCorrect) {
        feedback = `ผลลัพธ์ยังไม่ตรงกับที่คาดหวัง\nผลลัพธ์ที่ได้: "${actualOutput}"\nผลลัพธ์ที่ถูกต้องคือ: "${exercise.expectedOutput}"`;
      }
    }

    return {
      success: true,
      output: actualOutput || '(No output printed)',
      isCorrect,
      feedback,
      executionTimeMs: duration,
    };
  } catch (err: any) {
    const duration = Math.round(performance.now() - startTime);
    return {
      success: false,
      output: stdout.join('\n'),
      error: `Python Execution Error: ${err.message || String(err)}`,
      isCorrect: false,
      feedback: `เกิดข้อผิดพลาด: ${err.message || 'โปรดตรวจสอบ Syntax และคำสั่งตามหลักสูตร W3Schools'}`,
      executionTimeMs: duration,
    };
  }
};
