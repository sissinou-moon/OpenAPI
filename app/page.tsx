'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { ResponseView } from '@/components/response-view';
import { MethodBadge } from '@/components/method-badge';
import { CodeBlock } from '@/components/ui/code-block';
import { generateCurl, generateNode } from '@/lib/code-generator';
import { parseOpenABI } from '@/lib/parser';
import { OpenAPISpec, Operation, Parameter } from '@/lib/openapi';
import { SAMPLE_YAML } from '@/lib/sample'; // Assuming this exists or I'll create it
import { Upload, Play, RefreshCw, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'curl' | 'node'>('curl');

  // Request State
  const [reqBody, setReqBody] = useState<string>('');
  const [reqParams, setReqParams] = useState<Record<string, string>>({});
  const [reqHeaders, setReqHeaders] = useState<Record<string, string>>({});

  // Response State
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
    error?: string;
  } | null>(null);

  // Load sample on mount
  useEffect(() => {
    const parsed = parseOpenABI(SAMPLE_YAML);
    if (parsed) {
      setSpec(parsed);
      // Select first path/method by default
      const firstPath = Object.keys(parsed.paths)[0];
      if (firstPath) {
        const firstMethod = Object.keys(parsed.paths[firstPath] as object).find(k => k !== 'parameters' && k !== 'servers');
        if (firstMethod) {
          handleSelectPath(firstPath, firstMethod);
        }
      }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseOpenABI(content);
      if (parsed) {
        setSpec(parsed);
        setError(null);
      } else {
        setError("Failed to parse OpenAPI file. Ensure it is valid JSON or YAML.");
      }
    };
    reader.readAsText(file);
  };

  const handleSelectPath = (path: string, method: string) => {
    setSelectedPath(path);
    setSelectedMethod(method);
    setResponse(null);
    setError(null);

    // Reset inputs
    setReqParams({});
    setReqHeaders({});

    if (!spec) return;

    const op = spec.paths[path]?.[method];
    if (op && op.requestBody) {
      // Try to find example
      const content = op.requestBody.content?.['application/json'];
      if (content?.example) {
        setReqBody(JSON.stringify(content.example, null, 2));
      } else if (content?.schema?.properties) {
        // Generate dummy example from properties
        const example: Record<string, any> = {};
        Object.entries(content.schema.properties).forEach(([key, schema]: [string, any]) => {
          example[key] = schema.example || (schema.type === 'string' ? "string" : schema.type === 'integer' ? 0 : null);
        });
        setReqBody(JSON.stringify(example, null, 2));
      } else {
        setReqBody('{}');
      }
    } else {
      setReqBody('');
    }
  };

  const executeRequest = async () => {
    if (!spec || !selectedPath || !selectedMethod) return;

    setLoading(true);
    setResponse(null);

    // Construct URL
    // Assume first server or localhost if not defined
    let baseUrl = spec.servers?.[0]?.url || 'http://localhost:3000';
    if (!baseUrl.startsWith('http')) {
      // Handle relative URLs if hosted (but here we are viewer)
      // For demo, we might need a proxy or user puts full URL
      // check if server url is relative
      baseUrl = 'http://localhost:3000' + baseUrl; // Fallback for demo
    }

    // Replace path params
    let url = baseUrl + selectedPath;
    // Basic replacement for {param}
    Object.entries(reqParams).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });

    try {
      // This is a browser request, so CORS might be an issue.
      // In a real app we'd use a proxy route.
      const res = await fetch(url, {
        method: selectedMethod.toUpperCase(),
        headers: {
          'Content-Type': 'application/json',
          ...reqHeaders
        },
        body: ['get', 'head'].includes(selectedMethod.toLowerCase()) ? undefined : reqBody
      });

      const data = await res.json().catch(() => null);

      const headers: Record<string, string> = {};
      res.headers.forEach((v, k) => headers[k] = v);

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers,
        body: data
      });
    } catch (err) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        body: null,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getActiveOperation = (): Operation | null => {
    if (!spec || !selectedPath || !selectedMethod) return null;
    return spec.paths[selectedPath]?.[selectedMethod] as Operation;
  };

  const activeOp = getActiveOperation();

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-white/5 bg-neutral-900/50 backdrop-blur flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-bold">
            OP
          </div>
          <span className="font-semibold text-lg tracking-tight">OpenAPI Viewer</span>
        </div>

        <div className="flex items-center gap-4">
          <label className="cursor-pointer px-4 py-2 bg-neutral-800 hover:bg-neutral-700 hover:text-white rounded-md text-sm transition-colors flex items-center gap-2">
            <Upload size={16} />
            <span>Import OpenAPI</span>
            <input type="file" accept=".json,.yaml,.yml" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-r border-white/5 flex flex-col bg-neutral-900/40">
          <Sidebar
            spec={spec}
            selectedPath={selectedPath || ''}
            selectedMethod={selectedMethod || ''}
            onSelect={handleSelectPath}
          />
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800">
          {activeOp ? (
            <div className="max-w-5xl mx-auto p-6 space-y-8">
              {/* Operation Header */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MethodBadge method={selectedMethod!} className="text-sm px-3 py-1" />
                  <h1 className="text-xl font-mono text-neutral-300">{selectedPath}</h1>
                </div>
                <h2 className="text-2xl font-semibold text-white">{activeOp.summary}</h2>
                {activeOp.description && (
                  <p className="text-neutral-400 leading-relaxed">{activeOp.description}</p>
                )}

                {/* Response Documentation */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Responses</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(activeOp.responses).map(([status, resp]) => (
                      <div key={status} className="flex items-start gap-3 p-3 rounded-lg border border-neutral-800 bg-neutral-900/30 text-sm">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-mono font-bold border",
                          status.startsWith('2') ? "text-green-400 border-green-400/20 bg-green-400/10" :
                            status.startsWith('3') ? "text-blue-400 border-blue-400/20 bg-blue-400/10" :
                              "text-red-400 border-red-400/20 bg-red-400/10"
                        )}>
                          {status}
                        </span>
                        <div className="space-y-1">
                          <p className="text-neutral-300 font-medium">{resp.description}</p>
                          {resp.content?.['application/json']?.schema && (
                            <details className="text-xs text-neutral-500 cursor-pointer">
                              <summary className="hover:text-emerald-400 transition-colors">View Schema</summary>
                              <CodeBlock
                                code={JSON.stringify(resp.content['application/json'].schema, null, 2)}
                                className="mt-2 text-[10px] max-h-40"
                              />
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Request Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                    <Play size={18} /> Request
                  </h3>

                  {/* Parameters */}
                  {activeOp.parameters && activeOp.parameters.length > 0 && (
                    <div className="space-y-3 bg-neutral-900/50 p-4 rounded-lg border border-white/5">
                      <h4 className="text-sm font-medium text-neutral-300">Parameters</h4>
                      <div className="space-y-2">
                        {activeOp.parameters.map(param => (
                          <div key={param.name} className="flex flex-col gap-1">
                            <label className="text-xs text-neutral-500 uppercase flex justify-between">
                              <span>{param.name} ({param.in})</span>
                              {param.required && <span className="text-red-400 text-[10px]">REQUIRED</span>}
                            </label>
                            <input
                              type="text"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors"
                              placeholder={param.description || `Enter ${param.name}`}
                              value={reqParams[param.name] || ''}
                              onChange={(e) => setReqParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Body Editor */}
                  {activeOp.requestBody && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-neutral-300">Request Body</h4>
                        <button
                          onClick={() => {
                            try {
                              const fmt = JSON.stringify(JSON.parse(reqBody), null, 2);
                              setReqBody(fmt);
                            } catch { }
                          }}
                          className="text-xs text-emerald-500 hover:text-emerald-400"
                        >
                          Prettify
                        </button>
                      </div>
                      <textarea
                        value={reqBody}
                        onChange={(e) => setReqBody(e.target.value)}
                        className="w-full h-64 bg-neutral-950 border border-neutral-800 rounded-lg p-4 font-mono text-sm text-neutral-300 focus:border-emerald-500 focus:outline-none resize-none scrollbar-thin"
                      />
                    </div>
                  )}

                  <button
                    onClick={executeRequest}
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />}
                    Send Request
                  </button>
                </div>

                {/* Code & Response Column */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-neutral-300">Generated Code</h3>

                  {/* Tabs for code */}
                  <div className="bg-neutral-900/30 rounded-lg border border-white/5 overflow-hidden">
                    <div className="flex border-b border-white/5">
                      <button
                        onClick={() => setActiveTab('curl')}
                        className={cn("px-4 py-2 text-sm transition-colors", activeTab === 'curl' ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/20" : "text-neutral-500 hover:text-neutral-300")}
                      >
                        cURL
                      </button>
                      <button
                        onClick={() => setActiveTab('node')}
                        className={cn("px-4 py-2 text-sm transition-colors", activeTab === 'node' ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/20" : "text-neutral-500 hover:text-neutral-300")}
                      >
                        Node.js
                      </button>
                    </div>
                    <CodeBlock
                      code={(() => {
                        try {
                          const bodyObj = reqBody ? JSON.parse(reqBody) : undefined;
                          const url = (spec?.servers?.[0]?.url || 'http://localhost:3000') + selectedPath;
                          const method = selectedMethod || 'GET';
                          const headers = { 'Content-Type': 'application/json', ...reqHeaders };

                          return activeTab === 'curl'
                            ? generateCurl(url, method, headers, bodyObj)
                            : generateNode(url, method, headers, bodyObj);
                        } catch {
                          return "Invalid JSON Body";
                        }
                      })()}
                      className="rounded-none border-none bg-transparent"
                    />
                  </div>

                  {/* Response Area */}
                  <AnimatePresence mode='wait'>
                    {response && (
                      <motion.div
                        key="response"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <ResponseView
                          status={response.status}
                          statusText={response.statusText}
                          headers={response.headers}
                          body={response.body}
                          error={response.error}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl">
                <div className="text-emerald-500">
                  <Play size={40} className="ml-1" />
                </div>
              </div>
              <p className="text-lg font-medium text-neutral-400">Select an endpoint to get started</p>
              <p className="text-sm text-neutral-600 max-w-xs text-center">
                Choose a path from the sidebar to view details, parameters, and test requests.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
