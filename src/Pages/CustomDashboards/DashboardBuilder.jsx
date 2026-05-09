import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';

import Button from '../../components/UI/button';
import Input from '../../components/UI/input';
import Select from '../../components/UI/select';
import { useDashboard } from '../../context/useDashboard';
import { formatApiError } from '../../services/api';
import { excelApi } from '../../services/excel';

const CHART_COLORS = ['#0A0A0A', '#002FA7', '#FF2A2A', '#FFC800', '#4B5563', '#16A34A'];

const WIDGET_LIBRARY = [
  { type: 'total_filter', label: 'Total filter', kind: 'card', defaults: { calculation: 'total' } },
  { type: 'average_filter', label: 'Average filter', kind: 'card', defaults: { calculation: 'average' } },
  { type: 'card', label: 'Cards', kind: 'card', defaults: { calculation: 'total' } },
  { type: 'bar_chart', label: 'Bar chart', kind: 'chart', defaults: { chartType: 'bar', calculation: 'total' } },
  { type: 'pie_chart', label: 'Pie chart', kind: 'chart', defaults: { chartType: 'pie', calculation: 'total' } },
  { type: 'line_chart', label: 'Line chart', kind: 'chart', defaults: { chartType: 'line', calculation: 'total' } },
];

const CALC_OPTIONS = [
  { value: 'total', label: 'Total' },
  { value: 'average', label: 'Average' },
  { value: 'count', label: 'Count' },
];

const normalizeRecords = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const toNumber = (value) => {
  const num = Number.parseFloat(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
};

const isNumericValue = (value) => toNumber(value) !== null;

const applyRowFilter = (row, filterColumn, filterValue) => {
  if (!filterColumn || !filterValue) return true;
  return String(row?.[filterColumn] ?? '').toLowerCase() === String(filterValue).toLowerCase();
};

const computeCardMetric = (rows, config) => {
  const scoped = rows.filter((row) => applyRowFilter(row, config.filterColumn, config.filterValue));
  if (config.calculation === 'count') return scoped.length;

  const values = scoped.map((row) => toNumber(row?.[config.valueColumn])).filter((v) => v !== null);
  if (!values.length) return 0;
  if (config.calculation === 'average') {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  return values.reduce((sum, v) => sum + v, 0);
};

const computeChartMetric = (rows, config) => {
  const scoped = rows.filter((row) => applyRowFilter(row, config.filterColumn, config.filterValue));
  if (!config.groupColumn) return [];

  const grouped = scoped.reduce((acc, row) => {
    const key = String(row?.[config.groupColumn] ?? 'Unknown');
    if (!acc[key]) {
      acc[key] = { key, count: 0, sum: 0 };
    }
    acc[key].count += 1;
    const num = toNumber(row?.[config.valueColumn]);
    if (num !== null) acc[key].sum += num;
    return acc;
  }, {});

  return Object.values(grouped).map((item) => ({
    label: item.key,
    value:
      config.calculation === 'count'
        ? item.count
        : config.calculation === 'average'
          ? (item.count ? item.sum / item.count : 0)
          : item.sum,
  }));
};

const formatMetric = (value) => {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return value.toFixed(2).replace(/\.00$/, '');
};

function WidgetCard({ widget, rows }) {
  const value = computeCardMetric(rows, widget.config);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {widget.config.calculation}
      </p>
      <h4 className="mt-1 text-sm font-semibold text-slate-700">{widget.title}</h4>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{formatMetric(value)}</p>
      <p className="mt-1 text-xs text-slate-500">
        {widget.config.valueColumn ? `Column: ${widget.config.valueColumn}` : 'Select a numeric column'}
      </p>
    </div>
  );
}

function WidgetChart({ widget, rows }) {
  const chartData = computeChartMetric(rows, widget.config).slice(0, Number(widget.config.maxItems || 12));
  const chartType = widget.config.chartType;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold text-slate-700">{widget.title}</h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#0A0A0A" strokeWidth={2} />
            </LineChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="label" outerRadius={90} label>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#002FA7" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function DashboardBuilder() {
  const { id } = useParams();
  const { currentDashboard, fetchDashboard, updateDashboard } = useDashboard();

  const [rows, setRows] = useState([]);
  const [widgets, setWidgets] = useState([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchDashboard(id);
  }, [id, fetchDashboard]);

  useEffect(() => {
    const loadRows = async () => {
      setLoading(true);
      try {
        const response = await excelApi.getByDashboardId(id);
        const records = normalizeRecords(response).filter((item) => item && typeof item === 'object');
        const merged = records.flatMap((item) => (Array.isArray(item.rawData) ? item.rawData : []));
        setRows(merged);
      } catch (error) {
        toast.error(formatApiError(error));
      } finally {
        setLoading(false);
      }
    };
    if (id) loadRows();
  }, [id]);

  useEffect(() => {
    const savedWidgets = Array.isArray(currentDashboard?.layout?.widgets)
      ? currentDashboard.layout.widgets
      : [];
    setWidgets(savedWidgets);
    if (savedWidgets.length) {
      setSelectedWidgetId(savedWidgets[0].id || '');
    }
  }, [currentDashboard?._id, currentDashboard?.updatedAt]);

  const columns = useMemo(() => {
    const set = new Set();
    rows.slice(0, 200).forEach((row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
    });
    return Array.from(set);
  }, [rows]);

  const numericColumns = useMemo(() => {
    return columns.filter((column) => rows.some((row) => isNumericValue(row?.[column])));
  }, [columns, rows]);

  const selectedWidget = widgets.find((item) => item.id === selectedWidgetId) || null;

  const makeWidget = (libraryType) => {
    const spec = WIDGET_LIBRARY.find((item) => item.type === libraryType);
    if (!spec) return null;

    const numericDefault = numericColumns[0] || '';
    const groupDefault = columns[0] || '';
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: spec.type,
      kind: spec.kind,
      title: spec.label,
      config:
        spec.kind === 'card'
          ? {
              calculation: spec.defaults.calculation,
              valueColumn: numericDefault,
              filterColumn: '',
              filterValue: '',
            }
          : {
              chartType: spec.defaults.chartType,
              calculation: spec.defaults.calculation,
              valueColumn: numericDefault,
              groupColumn: groupDefault,
              filterColumn: '',
              filterValue: '',
              maxItems: 12,
            },
    };
  };

  const addWidget = (libraryType) => {
    const widget = makeWidget(libraryType);
    if (!widget) return;
    setWidgets((prev) => [...prev, widget]);
    setSelectedWidgetId(widget.id);
  };

  const updateSelectedWidget = (patch) => {
    if (!selectedWidgetId) return;
    setWidgets((prev) =>
      prev.map((widget) => (widget.id === selectedWidgetId ? { ...widget, ...patch } : widget))
    );
  };

  const updateSelectedWidgetConfig = (patch) => {
    if (!selectedWidgetId) return;
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === selectedWidgetId
          ? { ...widget, config: { ...widget.config, ...patch } }
          : widget
      )
    );
  };

  const removeWidget = (widgetId) => {
    setWidgets((prev) => prev.filter((widget) => widget.id !== widgetId));
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId('');
    }
  };

  const saveLayout = async () => {
    if (!id) return;
    setSavingLayout(true);
    try {
      await updateDashboard(id, {
        layout: {
          ...(currentDashboard?.layout || {}),
          widgets,
        },
      });
      toast.success('Dashboard layout saved');
    } catch (error) {
      toast.error(error?.message || 'Failed to save dashboard layout');
    } finally {
      setSavingLayout(false);
    }
  };

  const handleDropOnCanvas = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('widgetType');
    if (type) addWidget(type);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">
            {currentDashboard?.name || 'Sales Dashboard Builder'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Stage 4: Drag widgets from the right panel and drop into the dashboard canvas.
          </p>
          <div className="mt-3">
            <Button onClick={saveLayout} isLoading={savingLayout}>
              {savingLayout ? 'Saving...' : 'Save Layout'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          <section
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDropOnCanvas}
            className="min-h-[70vh] rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Dashboard Canvas</h2>
              <span className="text-xs text-slate-500">{widgets.length} widget(s)</span>
            </div>

            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Loading mapped data...
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                No mapped rows found. Complete upload and column mapping first.
              </div>
            ) : widgets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm text-slate-500">
                Drag and drop a widget from the right side to start building your dashboard.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {widgets.map((widget) => (
                  <div
                    key={widget.id}
                    className={`relative rounded-xl ${
                      selectedWidgetId === widget.id ? 'ring-2 ring-primary-400' : ''
                    }`}
                    onClick={() => setSelectedWidgetId(widget.id)}
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeWidget(widget.id);
                      }}
                      className="absolute right-3 top-3 z-10 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
                    >
                      Remove
                    </button>
                    {widget.kind === 'card' ? (
                      <WidgetCard widget={widget} rows={rows} />
                    ) : (
                      <WidgetChart widget={widget} rows={rows} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Available Widgets</h3>
              <div className="space-y-2">
                {WIDGET_LIBRARY.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData('widgetType', item.type)}
                    onClick={() => addWidget(item.type)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:bg-primary-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">Widget Configuration</h3>
              {!selectedWidget ? (
                <p className="text-sm text-slate-500">Select a widget from canvas to configure it.</p>
              ) : (
                <div className="space-y-3">
                  <Input
                    label="Widget name"
                    value={selectedWidget.title}
                    onChange={(event) => updateSelectedWidget({ title: event.target.value })}
                  />

                  <Select
                    label="Filter type"
                    value={selectedWidget.config.calculation}
                    onChange={(event) => updateSelectedWidgetConfig({ calculation: event.target.value })}
                    options={CALC_OPTIONS}
                    placeholder="Choose calculation"
                  />

                  <Select
                    label="Column to calculate"
                    value={selectedWidget.config.valueColumn}
                    onChange={(event) => updateSelectedWidgetConfig({ valueColumn: event.target.value })}
                    options={numericColumns.map((column) => ({ value: column, label: column }))}
                    placeholder="Numeric column"
                  />

                  {selectedWidget.kind === 'chart' ? (
                    <>
                      <Select
                        label="Chart type"
                        value={selectedWidget.config.chartType}
                        onChange={(event) => updateSelectedWidgetConfig({ chartType: event.target.value })}
                        options={[
                          { value: 'bar', label: 'Bar chart' },
                          { value: 'pie', label: 'Pie chart' },
                          { value: 'line', label: 'Line chart' },
                        ]}
                        placeholder="Choose chart"
                      />

                      <Select
                        label="Group by column"
                        value={selectedWidget.config.groupColumn}
                        onChange={(event) => updateSelectedWidgetConfig({ groupColumn: event.target.value })}
                        options={columns.map((column) => ({ value: column, label: column }))}
                        placeholder="Column"
                      />

                      <Input
                        label="Max categories"
                        type="number"
                        value={selectedWidget.config.maxItems}
                        onChange={(event) =>
                          updateSelectedWidgetConfig({
                            maxItems: Math.max(1, Number.parseInt(event.target.value || '1', 10)),
                          })
                        }
                      />
                    </>
                  ) : null}

                  <Select
                    label="Optional filter column"
                    value={selectedWidget.config.filterColumn}
                    onChange={(event) => updateSelectedWidgetConfig({ filterColumn: event.target.value })}
                    options={columns.map((column) => ({ value: column, label: column }))}
                    placeholder="No filter"
                  />

                  <Input
                    label="Optional filter value"
                    value={selectedWidget.config.filterValue}
                    onChange={(event) => updateSelectedWidgetConfig({ filterValue: event.target.value })}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => removeWidget(selectedWidget.id)}
                  >
                    Remove Widget
                  </Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
