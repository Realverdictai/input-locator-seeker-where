type LogItem = { 
  t: number; 
  level: 'info' | 'warn' | 'error'; 
  tag: string; 
  msg: string; 
  data?: any 
};

const logs: LogItem[] = [];

export function dbg(tag: string, msg: string, data?: any) {
  logs.push({ t: Date.now(), level: 'info', tag, msg, data });
  console.log(`[${tag}]`, msg, data);
}

export function dbe(tag: string, msg: string, data?: any) {
  logs.push({ t: Date.now(), level: 'error', tag, msg, data });
  console.error(`[${tag}]`, msg, data);
}

export function getLogs() {
  return logs.slice(-200); // last 200
}

export function clearLogs() {
  logs.length = 0;
}

export function dbgWrap<T extends (...a: any) => any>(tag: string, fn: T): T {
  return ((...a: any) => {
    dbg(tag, 'call', a);
    try {
      const r = fn(...a);
      dbg(tag, 'ok', r);
      return r;
    } catch (e: any) {
      dbe(tag, 'err', e?.message || String(e));
      throw e;
    }
  }) as any;
}
