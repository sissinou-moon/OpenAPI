'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ResizablePanel } from '@/components/resizable-panel';
import { Sidebar } from '@/components/sidebar';
import { TabBar, Tab } from '@/components/tab-bar';
import { UrlBar } from '@/components/url-bar';
import { RequestPanel } from '@/components/request-panel';
import { ResponsePanel } from '@/components/response-panel';
import { parseOpenABI } from '@/lib/parser';
import { OpenAPISpec, Operation } from '@/lib/openapi';
import { SAMPLE_YAML } from '@/lib/sample';
import { Upload, Database, Plug, PlugZap, X } from 'lucide-react';

// Database imports
import { parseDatabaseYaml } from '@/lib/database-parser';
import {
  DatabaseSchema,
  ConnectionConfig,
  QueryResult,
} from '@/lib/database-types';
import { TableStructure } from '@/components/database/table-structure';
import { RelationsView } from '@/components/database/relations-view';
import { ConnectionModal } from '@/components/database/connection-modal';
import { DataTable } from '@/components/database/data-table';

interface BodyRow {
  key: string;
  value: string;
  enabled: boolean;
}

interface TabState {
  tab: Tab;
  // API State
  bodyRows?: BodyRow[];
  bearerToken?: string;
  response?: {
    status: number;
    statusText: string;
    body: any;
    error?: string;
  } | null;
  // Database State
  dbViewMode?: 'structure' | 'data' | 'relations';
  queryResult?: QueryResult | null;
  dataLoading?: boolean;
}

export default function Home() {
  // specs
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [dbSchema, setDbSchema] = useState<DatabaseSchema | null>(null);

  // Tabs & Navigation
  const [tabs, setTabs] = useState<TabState[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Global Loading (for API requests mainly)
  const [loading, setLoading] = useState(false);

  // Database Connection State (Global)
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [connection, setConnection] = useState<ConnectionConfig | null>(null);
  const [connected, setConnected] = useState(false);

  // Persistence: Load on mount
  useEffect(() => {
    const savedSpec = localStorage.getItem('op-spec');
    const savedDbSchema = localStorage.getItem('op-db-schema');
    const savedTabs = localStorage.getItem('op-tabs');
    const savedActiveTabId = localStorage.getItem('op-active-tab-id');
    const savedConnection = localStorage.getItem('op-connection');
    const savedConnected = localStorage.getItem('op-connected');

    if (savedSpec) {
      try {
        setSpec(JSON.parse(savedSpec));
      } catch (e) {
        console.error('Failed to parse saved spec', e);
      }
    } else {
      // Default to sample if no saved spec
      const parsed = parseOpenABI(SAMPLE_YAML);
      if (parsed) setSpec(parsed);
    }

    if (savedDbSchema) {
      try {
        setDbSchema(JSON.parse(savedDbSchema));
      } catch (e) {
        console.error('Failed to parse saved db schema', e);
      }
    }

    if (savedTabs) {
      try {
        const parsed = JSON.parse(savedTabs);
        setTabs(parsed.map((t: any) => ({ ...t, dataLoading: false })));
      } catch (e) {
        console.error('Failed to parse saved tabs', e);
      }
    }

    if (savedActiveTabId) {
      setActiveTabId(savedActiveTabId);
    }

    if (savedConnection) {
      try {
        setConnection(JSON.parse(savedConnection));
      } catch (e) {
        console.error('Failed to parse saved connection', e);
      }
    }

    if (savedConnected === 'true') {
      setConnected(true);
    }
  }, []);

  // Persistence: Save on changes
  useEffect(() => {
    if (spec) localStorage.setItem('op-spec', JSON.stringify(spec));
    if (dbSchema) localStorage.setItem('op-db-schema', JSON.stringify(dbSchema));
    if (tabs.length > 0) localStorage.setItem('op-tabs', JSON.stringify(tabs));
    else localStorage.removeItem('op-tabs');

    if (activeTabId) localStorage.setItem('op-active-tab-id', activeTabId);
    else localStorage.removeItem('op-active-tab-id');

    if (connection) localStorage.setItem('op-connection', JSON.stringify(connection));
    else localStorage.removeItem('op-connection');

    localStorage.setItem('op-connected', connected.toString());
  }, [spec, dbSchema, tabs, activeTabId, connection, connected]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const fileName = file.name.toLowerCase();

      // Simple heuristic detection
      if (content.includes('openapi:') || content.includes('swagger:')) {
        const parsed = parseOpenABI(content);
        if (parsed) {
          setSpec(parsed);
          // Optional: clear API tabs?
        }
      } else if (content.includes('database:') && content.includes('tables:')) {
        const parsed = parseDatabaseYaml(content);
        if (parsed) {
          setDbSchema(parsed);
        }
      }
    };
    reader.readAsText(file);
  };

  // ─── Connection Handlers ─────────────────────────────────────────────

  const handleConnect = async (config: ConnectionConfig) => {
    setConnection(config);
    setConnected(true);
    setShowConnectionModal(false);
  };

  const handleDisconnect = () => {
    setConnection(null);
    setConnected(false);
    // Clear data from active tabs if needed, but maybe keep structure visible
    setTabs(prev => prev.map(t => ({ ...t, queryResult: null })));
  };

  // ─── Route/Table Selection ───────────────────────────────────────────

  const handleSelectRoute = useCallback((path: string, method: string) => {
    if (!spec) return;

    const tabId = `api-${method}-${path}`;
    const existing = tabs.find(t => t.tab.id === tabId);

    if (existing) {
      setActiveTabId(tabId);
      return;
    }

    const operation = spec.paths[path]?.[method] as Operation | undefined;
    if (!operation) return;

    // Initialize body rows
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
        type: 'api',
        label: operation.summary || path,
        path,
        method,
      },
      bodyRows,
      bearerToken: '',
      response: null
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
  }, [spec, tabs]);

  const handleSelectTable = useCallback((tableName: string) => {
    if (!dbSchema) return;

    const tabId = `db-${tableName}`;
    const existing = tabs.find(t => t.tab.id === tabId);

    if (existing) {
      setActiveTabId(tabId);
      return;
    }

    const newTab: TabState = {
      tab: {
        id: tabId,
        type: 'database',
        label: tableName,
        tableName: tableName,
      },
      dbViewMode: 'structure',
      queryResult: null,
      dataLoading: false,
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(tabId);
  }, [dbSchema, tabs]);

  // ─── Tab Management ──────────────────────────────────────────────────

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

  const updateActiveTab = useCallback((updates: Partial<Omit<TabState, 'tab'>>) => {
    setTabs(prev => prev.map(t =>
      t.tab.id === activeTabId ? { ...t, ...updates } : t
    ));
  }, [activeTabId]);

  // ─── API Request Logic ───────────────────────────────────────────────

  const handleSendRequest = async () => {
    if (!spec || !activeTabState || activeTabState.tab.type !== 'api') return;

    setLoading(true);
    updateActiveTab({ response: null });

    const { path, method } = activeTabState.tab;
    if (!path || !method) return;

    let baseUrl = spec.servers?.[0]?.url || '';
    if (!baseUrl.startsWith('http')) {
      baseUrl = 'http://localhost:3000' + baseUrl;
    }

    const url = baseUrl + path;
    const bodyObject: Record<string, any> = {};
    activeTabState.bodyRows
      ?.filter(r => r.enabled && r.key)
      .forEach(r => { bodyObject[r.key] = r.value; });

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (activeTabState.bearerToken) {
      headers['Authorization'] = `Bearer ${activeTabState.bearerToken}`;
    }

    try {
      const proxyRes = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          method: method.toUpperCase(),
          headers,
          body: ['get', 'head'].includes(method.toLowerCase()) ? undefined : bodyObject
        })
      });

      const res = await proxyRes.json();

      updateActiveTab({
        response: {
          status: res.status,
          statusText: res.statusText,
          body: res.body,
          error: res.error
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

  // ─── DB Data Fetch Logic ─────────────────────────────────────────────

  const fetchTableData = useCallback(async (tableName: string, page: number = 1) => {
    if (!connection) return;

    // We need to find the tab for this table to update its state
    // But since this is triggered usually from the active tab context:
    updateActiveTab({ dataLoading: true });

    try {
      const res = await fetch('/api/db-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection,
          query: `SELECT * FROM ${tableName}`,
          page,
          pageSize: 50,
        }),
      });

      const result = await res.json();
      if (result.error) {
        console.error('Query error:', result.error);
        updateActiveTab({ queryResult: null });
      } else {
        updateActiveTab({ queryResult: result });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      updateActiveTab({ queryResult: null });
    } finally {
      updateActiveTab({ dataLoading: false });
    }
  }, [connection, updateActiveTab]);

  const handleUpdateCell = useCallback(async (row: any, column: string, newValue: any) => {
    if (!connection || !activeTabState?.tab.tableName) return;

    const tableName = activeTabState.tab.tableName;
    const tableDef = dbSchema?.tables[tableName];

    // Find primary key
    let primaryKey = '';
    if (tableDef) {
      for (const [colName, colDef] of Object.entries(tableDef.columns)) {
        if (colDef.primary_key) {
          primaryKey = colName;
          break;
        }
      }
    }

    if (!primaryKey) {
      if (row._id !== undefined) primaryKey = '_id';
      else if (row.id !== undefined) primaryKey = 'id';
      else if (row.uuid !== undefined) primaryKey = 'uuid';
      else primaryKey = Object.keys(row)[0];
    }

    const primaryKeyValue = row[primaryKey];

    try {
      const res = await fetch('/api/db-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection,
          tableName,
          primaryKey,
          primaryKeyValue,
          column,
          newValue,
        }),
      });

      const result = await res.json();
      if (result.error) {
        alert('Update error: ' + result.error);
      } else {
        // Refresh data
        fetchTableData(tableName, activeTabState.queryResult?.page || 1);
      }
    } catch (err) {
      console.error('Update fetch error:', err);
    }
  }, [connection, activeTabState, dbSchema, fetchTableData]);

  const handleDeleteRows = useCallback(async (rows: any[]) => {
    if (!connection || !activeTabState?.tab.tableName || rows.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${rows.length} row(s)? This action cannot be undone.`)) {
      return;
    }

    const tableName = activeTabState.tab.tableName;
    const tableDef = dbSchema?.tables[tableName];

    // Find primary key
    let primaryKey = '';
    if (tableDef) {
      for (const [colName, colDef] of Object.entries(tableDef.columns)) {
        if (colDef.primary_key) {
          primaryKey = colName;
          break;
        }
      }
    }

    if (!primaryKey) {
      const firstRow = rows[0];
      if (firstRow._id !== undefined) primaryKey = '_id';
      else if (firstRow.id !== undefined) primaryKey = 'id';
      else if (firstRow.uuid !== undefined) primaryKey = 'uuid';
      else primaryKey = Object.keys(firstRow)[0];
    }

    const primaryKeyValues = rows.map(r => r[primaryKey]);

    try {
      const res = await fetch('/api/db-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection,
          tableName,
          primaryKey,
          primaryKeyValues,
        }),
      });

      const result = await res.json();
      if (result.error) {
        alert('Deletion error: ' + result.error);
      } else {
        // Refresh data
        fetchTableData(tableName, activeTabState.queryResult?.page || 1);
      }
    } catch (err) {
      console.error('Deletion fetch error:', err);
    }
  }, [connection, activeTabState, dbSchema, fetchTableData]);

  // Derived state for rendering
  const activeOperation = activeTabState && spec && activeTabState.tab.type === 'api' && activeTabState.tab.path && activeTabState.tab.method
    ? spec.paths[activeTabState.tab.path]?.[activeTabState.tab.method] as Operation | undefined
    : null;

  const exampleResponse = activeOperation?.responses?.['200']?.content?.['application/json']?.example;

  const currentTableDef = activeTabState && dbSchema && activeTabState.tab.type === 'database' && activeTabState.tab.tableName
    ? dbSchema.tables[activeTabState.tab.tableName]
    : null;

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

        <div className="flex items-center gap-3">
          {/* Connection Status */}
          {connected ? (
            <div className="flex items-center gap-2 bg-neutral-800/50 rounded-lg pl-3 pr-1 py-1">
              <div className="flex items-center gap-1.5">
                <PlugZap size={12} className="text-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-medium">
                  Connected
                </span>
              </div>
              <div className="w-px h-3 bg-neutral-700 mx-1" />
              <button
                onClick={handleDisconnect}
                className="p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-red-400 transition-colors"
                title="Disconnect"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConnectionModal(true)}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs transition-colors flex items-center gap-2"
            >
              <Plug size={12} />
              Connect DB
            </button>
          )}

          <label className="cursor-pointer px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs transition-colors flex items-center gap-2 font-medium shadow-sm shadow-emerald-500/20">
            <Upload size={14} />
            <span>Import File</span>
            <input type="file" accept=".json,.yaml,.yml" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
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
            dbSchema={dbSchema}
            onSelectRoute={handleSelectRoute}
            onSelectTable={handleSelectTable}
            className="h-full"
          />

          {/* Content Area */}
          <div className="h-full flex flex-col bg-neutral-925">
            {/* Tab Bar */}
            <TabBar
              tabs={tabs.map(t => t.tab)}
              activeTabId={activeTabId}
              onSelectTab={setActiveTabId}
              onCloseTab={handleCloseTab}
            />

            {activeTabState ? (
              activeTabState.tab.type === 'api' ? (
                /* ─── API View ─── */
                <>
                  <UrlBar
                    method={activeTabState.tab.method || 'GET'}
                    baseUrl={spec?.servers?.[0]?.url || ''}
                    path={activeTabState.tab.path || ''}
                    onSend={handleSendRequest}
                    loading={loading}
                  />
                  <div className="flex-1 overflow-hidden">
                    <ResizablePanel
                      direction="horizontal"
                      defaultSize={50}
                      minSize={30}
                      maxSize={70}
                      storageKey="request-response-split"
                      className="h-full w-full"
                    >
                      <RequestPanel
                        operation={activeOperation || null}
                        baseUrl={spec?.servers?.[0]?.url || ''}
                        path={activeTabState.tab.path || ''}
                        method={activeTabState.tab.method || ''}
                        bodyRows={activeTabState.bodyRows || []}
                        bearerToken={activeTabState.bearerToken || ''}
                        onBodyRowsChange={(rows) => updateActiveTab({ bodyRows: rows })}
                        onBearerTokenChange={(token) => updateActiveTab({ bearerToken: token })}
                        className="h-full"
                      />
                      <ResponsePanel
                        exampleResponse={exampleResponse}
                        liveResponse={activeTabState.response || null}
                        loading={loading}
                        className="h-full"
                      />
                    </ResizablePanel>
                  </div>
                </>
              ) : (
                /* ─── Database View ─── */
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Database Toolbar */}
                  <div className="flex border-b border-neutral-800 bg-neutral-900/50">
                    <button
                      onClick={() => updateActiveTab({ dbViewMode: 'structure' })}
                      className={cn(
                        "px-4 py-2 text-xs font-medium transition-colors",
                        activeTabState.dbViewMode !== 'data' && activeTabState.dbViewMode !== 'relations'
                          ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/30"
                          : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      Structure
                    </button>
                    <button
                      onClick={() => {
                        updateActiveTab({ dbViewMode: 'data' });
                        if (connected && activeTabState.tab.tableName && !activeTabState.queryResult) {
                          fetchTableData(activeTabState.tab.tableName);
                        }
                      }}
                      className={cn(
                        "px-4 py-2 text-xs font-medium transition-colors",
                        activeTabState.dbViewMode === 'data'
                          ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/30"
                          : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      Data
                    </button>
                    <button
                      onClick={() => updateActiveTab({ dbViewMode: 'relations' })}
                      className={cn(
                        "px-4 py-2 text-xs font-medium transition-colors",
                        activeTabState.dbViewMode === 'relations'
                          ? "text-emerald-400 border-b-2 border-emerald-400 bg-emerald-950/30"
                          : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      Relations
                    </button>
                  </div>

                  <div className="flex-1 overflow-hidden relative">
                    {activeTabState.dbViewMode === 'data' ? (
                      connected ? (
                        <DataTable
                          data={activeTabState.queryResult || null}
                          loading={!!activeTabState.dataLoading}
                          sensitiveColumns={
                            activeTabState.tab.tableName && dbSchema?.tables[activeTabState.tab.tableName]
                              ? Object.entries(dbSchema.tables[activeTabState.tab.tableName].columns)
                                .filter(([, col]) => col.sensitive)
                                .map(([name]) => name)
                              : []
                          }
                          tableName={activeTabState.tab.tableName}
                          tableDef={currentTableDef}
                          onPageChange={(page) =>
                            activeTabState.tab.tableName && fetchTableData(activeTabState.tab.tableName, page)
                          }
                          onUpdateCell={handleUpdateCell}
                          onDeleteRows={handleDeleteRows}
                          className="h-full"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                          <Plug className="w-10 h-10 mb-2 opacity-50" />
                          <p className="text-sm">Connect to a database to view live data</p>
                          <button
                            onClick={() => setShowConnectionModal(true)}
                            className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
                          >
                            Connect Now
                          </button>
                        </div>
                      )
                    ) : activeTabState.dbViewMode === 'relations' ? (
                      dbSchema && (
                        <RelationsView
                          schema={dbSchema}
                          selectedTable={activeTabState.tab.tableName || null}
                          onSelectTable={handleSelectTable}
                          className="h-full"
                        />
                      )
                    ) : (
                      /* Structure View */
                      activeTabState.tab.tableName && currentTableDef && (
                        <TableStructure
                          tableName={activeTabState.tab.tableName}
                          table={currentTableDef}
                          onNavigateTable={handleSelectTable}
                          className="h-full"
                        />
                      )
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-600">
                <div className="w-16 h-16 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 shadow-inner">
                  <Database size={24} className="text-neutral-700" />
                </div>
                <p className="text-sm font-medium">No items open</p>
                <p className="text-xs text-neutral-700 mt-1 max-w-[200px] text-center">
                  Select an API route or Database table from the sidebar to view details
                </p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </div>

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
        onConnect={handleConnect}
        initialConfig={connection}
      />
    </div>
  );
}
