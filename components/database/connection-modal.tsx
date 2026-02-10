'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
    ConnectionConfig,
    DatabaseProvider,
    DATABASE_PROVIDERS,
    PostgresConnection,
    MySQLConnection,
    SupabaseConnection,
    FirebaseConnection,
} from '@/lib/database-types';
import {
    X,
    ChevronLeft,
    Loader2,
    CheckCircle2,
    XCircle,
    Eye,
    EyeOff,
    Plug,
    Shield,
} from 'lucide-react';

interface ConnectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: (config: ConnectionConfig) => void;
}

function PasswordInput({
    value,
    onChange,
    placeholder,
    label,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    label: string;
}) {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-medium">
                {label}
            </label>
            <div className="relative">
                <input
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full bg-neutral-800/60 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all pr-9"
                />
                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                >
                    {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
            </div>
        </div>
    );
}

function TextInput({
    value,
    onChange,
    placeholder,
    label,
    type = 'text',
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    label: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-medium">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-neutral-800/60 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
            />
        </div>
    );
}

function ToggleInput({
    value,
    onChange,
    label,
}: {
    value: boolean;
    onChange: (v: boolean) => void;
    label: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <label className="text-xs text-neutral-400 font-medium">{label}</label>
            <button
                type="button"
                onClick={() => onChange(!value)}
                className={cn(
                    'w-10 h-5 rounded-full transition-colors relative',
                    value ? 'bg-emerald-500' : 'bg-neutral-700'
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                        value ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                />
            </button>
        </div>
    );
}

// ── Per-Provider Forms ──────────────────────────────────────────

function PostgresForm({
    onSubmit,
}: {
    onSubmit: (c: PostgresConnection) => void;
}) {
    const [host, setHost] = useState('localhost');
    const [port, setPort] = useState('5432');
    const [database, setDatabase] = useState('');
    const [username, setUsername] = useState('postgres');
    const [password, setPassword] = useState('');
    const [ssl, setSsl] = useState(false);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({
                    provider: 'postgresql',
                    host,
                    port: parseInt(port) || 5432,
                    database,
                    username,
                    password,
                    ssl,
                });
            }}
            className="space-y-4"
        >
            <div className="grid grid-cols-2 gap-3">
                <TextInput label="Host" value={host} onChange={setHost} placeholder="localhost" />
                <TextInput label="Port" value={port} onChange={setPort} placeholder="5432" type="number" />
            </div>
            <TextInput label="Database" value={database} onChange={setDatabase} placeholder="my_database" />
            <TextInput label="Username" value={username} onChange={setUsername} placeholder="postgres" />
            <PasswordInput label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
            <ToggleInput label="SSL Connection" value={ssl} onChange={setSsl} />
            <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                <Plug size={14} />
                Connect
            </button>
        </form>
    );
}

function MySQLForm({ onSubmit }: { onSubmit: (c: MySQLConnection) => void }) {
    const [host, setHost] = useState('localhost');
    const [port, setPort] = useState('3306');
    const [database, setDatabase] = useState('');
    const [username, setUsername] = useState('root');
    const [password, setPassword] = useState('');
    const [ssl, setSsl] = useState(false);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({
                    provider: 'mysql',
                    host,
                    port: parseInt(port) || 3306,
                    database,
                    username,
                    password,
                    ssl,
                });
            }}
            className="space-y-4"
        >
            <div className="grid grid-cols-2 gap-3">
                <TextInput label="Host" value={host} onChange={setHost} placeholder="localhost" />
                <TextInput label="Port" value={port} onChange={setPort} placeholder="3306" type="number" />
            </div>
            <TextInput label="Database" value={database} onChange={setDatabase} placeholder="my_database" />
            <TextInput label="Username" value={username} onChange={setUsername} placeholder="root" />
            <PasswordInput label="Password" value={password} onChange={setPassword} placeholder="••••••••" />
            <ToggleInput label="SSL Connection" value={ssl} onChange={setSsl} />
            <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                <Plug size={14} />
                Connect
            </button>
        </form>
    );
}

function SupabaseForm({
    onSubmit,
}: {
    onSubmit: (c: SupabaseConnection) => void;
}) {
    const [projectUrl, setProjectUrl] = useState('');
    const [anonKey, setAnonKey] = useState('');
    const [serviceRoleKey, setServiceRoleKey] = useState('');

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ provider: 'supabase', projectUrl, anonKey, serviceRoleKey });
            }}
            className="space-y-4"
        >
            <TextInput
                label="Project URL"
                value={projectUrl}
                onChange={setProjectUrl}
                placeholder="https://xxxx.supabase.co"
            />
            <PasswordInput
                label="Anon Key"
                value={anonKey}
                onChange={setAnonKey}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
            />
            <PasswordInput
                label="Service Role Key"
                value={serviceRoleKey}
                onChange={setServiceRoleKey}
                placeholder="eyJhbGciOiJIUzI1NiIs..."
            />
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-400 text-[11px]">
                <Shield size={14} className="shrink-0" />
                <span>Service role key has full admin access. Keep it secure.</span>
            </div>
            <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                <Plug size={14} />
                Connect
            </button>
        </form>
    );
}

function FirebaseForm({
    onSubmit,
}: {
    onSubmit: (c: FirebaseConnection) => void;
}) {
    const [projectId, setProjectId] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [databaseUrl, setDatabaseUrl] = useState('');

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ provider: 'firebase', projectId, apiKey, databaseUrl });
            }}
            className="space-y-4"
        >
            <TextInput
                label="Project ID"
                value={projectId}
                onChange={setProjectId}
                placeholder="my-project-12345"
            />
            <PasswordInput
                label="API Key"
                value={apiKey}
                onChange={setApiKey}
                placeholder="AIzaSy..."
            />
            <TextInput
                label="Database URL"
                value={databaseUrl}
                onChange={setDatabaseUrl}
                placeholder="https://my-project.firebaseio.com"
            />
            <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
                <Plug size={14} />
                Connect
            </button>
        </form>
    );
}

// ── Main Modal ──────────────────────────────────────────────────

export function ConnectionModal({
    isOpen,
    onClose,
    onConnect,
}: ConnectionModalProps) {
    const [selectedProvider, setSelectedProvider] = useState<DatabaseProvider | null>(null);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
                    <div className="flex items-center gap-2">
                        {selectedProvider && (
                            <button
                                onClick={() => setSelectedProvider(null)}
                                className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors mr-1"
                            >
                                <ChevronLeft size={16} />
                            </button>
                        )}
                        <Plug size={16} className="text-emerald-400" />
                        <h3 className="text-sm font-semibold text-white">
                            {selectedProvider
                                ? `Connect to ${DATABASE_PROVIDERS.find((p) => p.id === selectedProvider)?.name}`
                                : 'Connect to Database'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5">
                    {!selectedProvider ? (
                        /* Provider Picker */
                        <div className="grid grid-cols-2 gap-3">
                            {DATABASE_PROVIDERS.map((provider) => (
                                <button
                                    key={provider.id}
                                    onClick={() => setSelectedProvider(provider.id)}
                                    className="p-4 rounded-xl border border-neutral-800 bg-neutral-800/30 hover:bg-neutral-800/60 hover:border-neutral-700 transition-all text-left group"
                                >
                                    <div className="text-2xl mb-2">{provider.icon}</div>
                                    <h4 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                                        {provider.name}
                                    </h4>
                                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                                        {provider.description}
                                    </p>
                                    <div
                                        className="w-full h-0.5 rounded mt-3 opacity-30"
                                        style={{ backgroundColor: provider.color }}
                                    />
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* Provider-Specific Form */
                        <div>
                            {selectedProvider === 'postgresql' && (
                                <PostgresForm onSubmit={onConnect} />
                            )}
                            {selectedProvider === 'mysql' && (
                                <MySQLForm onSubmit={onConnect} />
                            )}
                            {selectedProvider === 'supabase' && (
                                <SupabaseForm onSubmit={onConnect} />
                            )}
                            {selectedProvider === 'firebase' && (
                                <FirebaseForm onSubmit={onConnect} />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Security Notice */}
                <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/50">
                    <p className="text-[10px] text-neutral-600 flex items-center gap-1.5">
                        <Shield size={10} />
                        Credentials are used for this session only and never stored or transmitted to third parties.
                    </p>
                </div>
            </div>
        </div>
    );
}
