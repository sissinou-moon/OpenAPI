'use client';

import { useState, useEffect, useCallback } from 'react';
import { ResizablePanel } from '@/components/resizable-panel';
import { Sidebar } from '@/components/sidebar';
import { TabBar, Tab } from '@/components/tab-bar';
import { UrlBar } from '@/components/url-bar';
import { RequestPanel } from '@/components/request-panel';
import { ResponsePanel } from '@/components/response-panel';
import { parseOpenABI } from '@/lib/parser';
import { OpenAPISpec, Operation } from '@/lib/openapi';
import { SAMPLE_YAML } from '@/lib/sample';
import { Upload } from 'lucide-react';

interface BodyRow {
  key: string;
  value: string;
  enabled: boolean;
}

interface TabState {
  tab: Tab;
  bodyRows: BodyRow[];
  bearerToken: string;
  response: {
    status: number;
    statusText: string;
    body: any;
    error?: string;
  } | null;
}

export default function Home() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load sample on mount
  useEffect(() => {
    const parsed = parseOpenABI(SAMPLE_YAML);
    if (parsed) {
      setSpec(parsed);
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
        setTabs([]);
        setActiveTabId(null);
      }
    };
    reader.readAsText(file);
  };

  const handleSelectRoute = useCallback((path: string, method: string) => {
    if (!spec) return;

    const tabId = `${method}-${path}`;
    const existing = tabs.find(t => t.tab.id === tabId);

    if (existing) {
      setActiveTabId(tabId);
      return;
    }

    const operation = spec.paths[path]?.[method] as Operation | undefined;
    if (!operation) return;

    // Initialize body rows from schema
    const bodyRows: BodyRow[] = [];
    const reqBody = operation.requestBody?.content?.['application/json'];
    if (reqBody?.schema?.properties) {
      const required = reqBody.schema.required || [];
      Object.entries(reqBody.schema.properties).forEach(([key, schema]) => {
        bodyRows.push({
          key,
          value: (schema as any).example || '',
          enabled: required.includes(key)
        });
      });
    }

    const newTab: TabState = {
      tab: {
        id: tabId,
        path,
        method,
        summary: operation.summary
      },
      bodyRows,
      bearerToken: '',
      response: null
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
  }, [spec, tabs]);

  const handleCloseTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.tab.id !== tabId);
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[filtered.length - 1].tab.id);
      } else if (filtered.length === 0) {
        setActiveTabId(null);
      }
      return filtered;
    });
  }, [activeTabId]);

  const activeTabState = tabs.find(t => t.tab.id === activeTabId);
  const activeOperation = activeTabState && spec
    ? spec.paths[activeTabState.tab.path]?.[activeTabState.tab.method] as Operation | undefined
    : null;

  const updateActiveTab = useCallback((updates: Partial<Omit<TabState, 'tab'>>) => {
    setTabs(prev => prev.map(t =>
      t.tab.id === activeTabId ? { ...t, ...updates } : t
    ));
  }, [activeTabId]);

  const handleSendRequest = async () => {
    if (!spec || !activeTabState) return;

    setLoading(true);
    updateActiveTab({ response: null });

    const { path, method } = activeTabState.tab;
    let baseUrl = spec.servers?.[0]?.url || '';
    if (!baseUrl.startsWith('http')) {
      baseUrl = 'http://localhost:3000' + baseUrl;
    }

    const url = baseUrl + path;
    const bodyObject: Record<string, any> = {};
    activeTabState.bodyRows
      .filter(r => r.enabled && r.key)
      .forEach(r => { bodyObject[r.key] = r.value; });

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (activeTabState.bearerToken) {
      headers['Authorization'] = `Bearer ${activeTabState.bearerToken}`;
    }

    try {
      const res = await fetch(url, {
        method: method.toUpperCase(),
        headers,
        body: ['get', 'head'].includes(method.toLowerCase())
          ? undefined
          : JSON.stringify(bodyObject)
      });

      const data = await res.json().catch(() => null);

      updateActiveTab({
        response: {
          status: res.status,
          statusText: res.statusText,
          body: data
        }
      });
    } catch (err) {
      updateActiveTab({
        response: {
          status: 0,
          statusText: 'Network Error',
          body: null,
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Get example response for current operation
  const exampleResponse = activeOperation?.responses?.['200']?.content?.['application/json']?.example;

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-neutral-200 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-12 border-b border-neutral-800 bg-neutral-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center text-black font-bold text-xs">
            OP
          </div>
          <span className="font-semibold text-sm">OpenAPI Viewer</span>
        </div>

        <label className="cursor-pointer px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-xs transition-colors flex items-center gap-2">
          <Upload size={14} />
          <span>Import</span>
          <input type="file" accept=".json,.yaml,.yml" onChange={handleFileUpload} className="hidden" />
        </label>
      </header>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanel
          direction="horizontal"
          defaultSize={22}
          minSize={15}
          maxSize={40}
          storageKey="sidebar-width"
          className="h-full w-full"
        >
          {/* Sidebar */}
          <Sidebar
            spec={spec}
            onSelectRoute={handleSelectRoute}
            className="h-full"
          />

          {/* Content Area */}
          <div className="h-full flex flex-col">
            {/* Tab Bar */}
            <TabBar
              tabs={tabs.map(t => t.tab)}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onCloseTab={handleCloseTab}
            />

            {activeTabState ? (
              <>
                {/* URL Bar */}
                <UrlBar
                  method={activeTabState.tab.method}
                  baseUrl={spec?.servers?.[0]?.url || ''}
                  path={activeTabState.tab.path}
                  onSend={handleSendRequest}
                  loading={loading}
                />

                {/* Split Request/Response */}
                <div className="flex-1 overflow-hidden">
                  <ResizablePanel
                    direction="horizontal"
                    defaultSize={50}
                    minSize={30}
                    maxSize={70}
                    storageKey="request-response-split"
                    className="h-full w-full"
                  >
                    {/* Request Panel */}
                    <RequestPanel
                      operation={activeOperation || null}
                      baseUrl={spec?.servers?.[0]?.url || ''}
                      path={activeTabState.tab.path}
                      method={activeTabState.tab.method}
                      bodyRows={activeTabState.bodyRows}
                      bearerToken={activeTabState.bearerToken}
                      onBodyRowsChange={(rows) => updateActiveTab({ bodyRows: rows })}
                      onBearerTokenChange={(token) => updateActiveTab({ bearerToken: token })}
                      className="h-full"
                    />

                    {/* Response Panel */}
                    <ResponsePanel
                      exampleResponse={exampleResponse}
                      liveResponse={activeTabState.response}
                      loading={loading}
                      className="h-full"
                    />
                  </ResizablePanel>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-600">
                <div className="w-16 h-16 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
                  <span className="text-2xl">📡</span>
                </div>
                <p className="text-sm font-medium">Select a route from the sidebar</p>
                <p className="text-xs text-neutral-700 mt-1">Click on any endpoint to start testing</p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </div>
    </div>
  );
}
