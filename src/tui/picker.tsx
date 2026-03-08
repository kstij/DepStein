import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { resolve } from 'path';
import { scan, findWorkspaceRoots } from '../core/scanner.js';
import type { CLIOptions, ScanResult } from '../core/types.js';
import { Dashboard } from './dashboard.js';

// ── PathPicker ─────────────────────────────────────────────────────────────────

interface PathPickerProps {
    initialPath: string;
    options: CLIOptions;
    onPick: (result: ScanResult) => void;
}

function PathPicker({ initialPath, options, onPick }: PathPickerProps) {
    const { exit } = useApp();
    // Default value: blank (shows placeholder ".") unless user passed an explicit path arg
    const [value, setValue] = useState(initialPath === process.cwd() ? '' : initialPath);
    const [error, setError] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);

    useInput((input, key) => {
        if (scanning) return;

        if (key.return) {
            const target = resolve(value.trim() || '.');
            const result = scan(target, options.ecosystem);
            if (!result) {
                const roots = findWorkspaceRoots(target);
                if (roots.length > 0) {
                    setError(
                        `Monorepo detected (${roots.length} workspaces). Enter a specific workspace path:\n` +
                        roots.slice(0, 4).map(r => `  ${r}`).join('\n'),
                    );
                } else {
                    setError(`No project found at: ${target}\nExpected: package.json, requirements.txt, pyproject.toml, go.mod, or Cargo.toml`);
                }
            } else if (result.dependencies.length === 0) {
                setError(`Project found but has no dependencies listed.`);
            } else {
                setScanning(true);
                onPick(result);
            }
            return;
        }

        if (key.escape) {
            exit();
            return;
        }

        if (key.backspace || key.delete) {
            setValue(v => v.slice(0, -1));
            setError(null);
            return;
        }

        if (!key.ctrl && !key.meta && input) {
            setValue(v => v + input);
            setError(null);
        }
    });

    const displayPath = value || '.';

    return (
        <Box flexDirection="column">
            {/* ── ASCII brand ── */}
            <Box flexDirection="column" paddingTop={1}>
                <Box paddingX={2}><Text bold color="cyan">{'██████╗ ███████╗██████╗ ███████╗████████╗███████╗██╗███╗   ██╗'}</Text></Box>
                <Box paddingX={2}><Text bold color="cyan">{'██╔══██╗██╔════╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║████╗  ██║'}</Text></Box>
                <Box paddingX={2}><Text bold color="cyan">{'██║  ██║█████╗  ██████╔╝███████╗   ██║   █████╗  ██║██╔██╗ ██║'}</Text></Box>
                <Box paddingX={2}><Text bold color="cyan">{'██║  ██║██╔══╝  ██╔═══╝ ╚════██║   ██║   ██╔══╝  ██║██║╚██╗██║'}</Text></Box>
                <Box paddingX={2}><Text bold color="cyan">{'██████╔╝███████╗██║     ███████║   ██║   ███████╗██║██║ ╚████║'}</Text></Box>
                <Box paddingX={2}><Text bold color="cyan">{'╚═════╝ ╚══════╝╚═╝     ╚══════╝   ╚═╝   ╚══════╝╚═╝╚═╝  ╚═══╝'}</Text></Box>
                <Box paddingX={2} paddingBottom={1}>
                    <Text color="#e04a1a">Dependency health scorer</Text>
                    <Text dimColor>  ·  npm · pypi · cargo · go</Text>
                </Box>
            </Box>

            {/* ── Divider ── */}
            <Box paddingX={2}>
                <Text dimColor>{'─'.repeat(66)}</Text>
            </Box>

            {/* ── Prompt ── */}
            <Box paddingX={3} paddingTop={1} flexDirection="column" gap={0}>
                <Text dimColor>Enter the path to a project, or press Enter to scan the current directory.</Text>

                <Box marginTop={1} gap={1}>
                    <Text bold color="#e04a1a">›</Text>
                    <Text bold color="white">Project path</Text>
                    <Text dimColor>·</Text>
                    <Text color="cyan">{displayPath}</Text>
                    <Text color="white">█</Text>
                </Box>

                {error && (
                    <Box marginTop={1} flexDirection="column">
                        {error.split('\n').map((line, i) => (
                            <Text key={i} color={i === 0 ? 'red' : 'yellow'}>{line}</Text>
                        ))}
                    </Box>
                )}
            </Box>

            {/* ── Footer ── */}
            <Box paddingX={3} paddingTop={2}>
                <Text dimColor>[enter] scan  [esc/ctrl-c] quit</Text>
            </Box>
        </Box>
    );
}

// ── PickerApp ─────────────────────────────────────────────────────────────────
// Top-level wrapper: shows PathPicker until a valid project is chosen, then
// hands off to the full Dashboard TUI.

interface PickerAppProps {
    initialPath: string;
    options: CLIOptions;
}

export function PickerApp({ initialPath, options }: PickerAppProps) {
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);

    if (scanResult) {
        return <Dashboard scanResult={scanResult} options={options} />;
    }

    return <PathPicker initialPath={initialPath} options={options} onPick={setScanResult} />;
}
