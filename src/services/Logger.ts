/**
 * @moduleName: Logger Service - Centralized Logging
 * @version: 1.0.0
 * @since: 2025-09-01
 * @lastUpdated: 2025-09-01
 * @projectSummary: Small logging utility that writes structured messages to a VS Code OutputChannel and console
 * @techStack: TypeScript, VS Code Extension API
 * @dependency: vscode (optional - injected for tests)
 * @briefDescription: Provides leveled logging (debug/info/warn/error) and an output channel named "Markdown Extended Toolbar". Safe to use when `vscode` isn't available by falling back to console.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITIES: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40
};

export class Logger {
    private vscode: any;
    private outputChannel: any | null = null;
    private level: LogLevel = 'info';

    constructor(vscodeImpl?: any) {
        try {
            this.vscode = vscodeImpl || require('vscode');
            if (this.vscode && this.vscode.window && typeof this.vscode.window.createOutputChannel === 'function') {
                this.outputChannel = this.vscode.window.createOutputChannel('Markdown Extended Toolbar');
            }
        } catch (e) {
            // Not running inside VS Code environment (e.g., unit tests). We'll fallback to console.
            this.vscode = undefined;
            this.outputChannel = null;
        }
    }

    public setLevel(level: LogLevel) {
        this.level = level;
    }

    private shouldLog(level: LogLevel) {
        return LEVEL_PRIORITIES[level] >= LEVEL_PRIORITIES[this.level];
    }

    private format(level: LogLevel, parts: any[]): string {
        const ts = new Date().toISOString();
        const message = parts.map(p => (typeof p === 'string' ? p : JSON.stringify(p))).join(' ');
        return `${ts} [${level.toUpperCase()}] ${message}`;
    }

    public debug(...parts: any[]) {
        if (!this.shouldLog('debug')) return;
        const line = this.format('debug', parts);
        this.outputChannel?.appendLine(line) ?? console.debug(line);
    }

    public info(...parts: any[]) {
        if (!this.shouldLog('info')) return;
        const line = this.format('info', parts);
        this.outputChannel?.appendLine(line) ?? console.info(line);
    }

    public warn(...parts: any[]) {
        if (!this.shouldLog('warn')) return;
        const line = this.format('warn', parts);
        this.outputChannel?.appendLine(line) ?? console.warn(line);
    }

    public error(...parts: any[]) {
        if (!this.shouldLog('error')) return;
        const line = this.format('error', parts);
        this.outputChannel?.appendLine(line) ?? console.error(line);
    }

    public append(...parts: any[]) {
        const line = this.format('info', parts);
        this.outputChannel?.appendLine(line) ?? console.log(line);
    }

    public dispose() {
        try {
            this.outputChannel?.dispose?.();
        } catch (e) {
            // ignore
        }
        this.outputChannel = null;
    }
}

// Export a default, single global logger instance. Tests can create their own if needed.
export const logger = new Logger();
