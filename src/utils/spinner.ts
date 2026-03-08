// Simple stderr spinner for --json mode (non-TUI fallback)
export class Spinner {
    private frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    private frame = 0;
    private interval: ReturnType<typeof setInterval> | null = null;
    private text = '';

    start(text: string): void {
        this.text = text;
        this.frame = 0;

        if (!process.stderr.isTTY) {
            process.stderr.write(`${text}\n`);
            return;
        }

        this.interval = setInterval(() => {
            process.stderr.write(`\r${this.frames[this.frame % this.frames.length]} ${this.text}`);
            this.frame++;
        }, 80);
    }

    update(text: string): void {
        this.text = text;
    }

    succeed(text?: string): void {
        this.stop();
        process.stderr.write(`\r✓ ${text ?? this.text}\n`);
    }

    fail(text?: string): void {
        this.stop();
        process.stderr.write(`\r✗ ${text ?? this.text}\n`);
    }

    stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        if (process.stderr.isTTY) {
            process.stderr.write('\r\x1b[K');
        }
    }
}
