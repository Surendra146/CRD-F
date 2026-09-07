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

const LAYER_SPECS = [
  { id: 'layer1', title: 'Layer 1', kind: 'card', maxItems: 4 },
  { id: 'layer2', title: 'Layer 2', kind: 'card', maxItems: 4 },
  { id: 'layer3', title: 'Layer 3', kind: 'chart', maxItems: 2 },
  { id: 'layer4', title: 'Layer 4', kind: 'chart', maxItems: 2 },
];

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

const INTERNAL_COLUMNS = new Set(['metadata', 'tenantId', 'dashboardId', 'sourceName', '_id', '__v']);

const normalizeMappingObject = (mapping) => {
  if (!mapping) return {};
  if (mapping instanceof Map) return Object.fromEntries(mapping.entries());
  if (typeof mapping === 'object') return mapping;
  return {};
};

const toTargetSourceMapping = (rawRows, mapping) => {
  const mappingObj = normalizeMappingObject(mapping);
  const entries = Object.entries(mappingObj).filter(([, value]) => value);
  if (!entries.length) return {};

  const sample = rawRows[0] || {};
  let sourceToTargetHits = 0;
  let targetToSourceHits = 0;

  entries.forEach(([key, value]) => {
    if (Object.prototype.hasOwnProperty.call(sample, key)) sourceToTargetHits += 1;
    if (Object.prototype.hasOwnProperty.call(sample, value)) targetToSourceHits += 1;
  });

  if (sourceToTargetHits >= targetToSourceHits) {
    return entries.reduce((acc, [source, target]) => {
      acc[target] = source;
      return acc;
    }, {});
  }

  return entries.reduce((acc, [target, source]) => {
    acc[target] = source;
    return acc;
  }, {});
};

const buildMappedRows = (rawRows, mapping) => {
  const rows = Array.isArray(rawRows) ? rawRows : [];
  const targetSourceMap = toTargetSourceMapping(rows, mapping);
  const targetFields = Object.keys(targetSourceMap);
  if (!rows.length || !targetFields.length) return [];

  return rows.map((row) => {
    const mapped = { metadata: row };

    targetFields.forEach((targetField) => {
      const sourceColumn = targetSourceMap[targetField];
      const value = row?.[sourceColumn];
      mapped[targetField] = value;
    });

    return mapped;
  });
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
          ? item.count
            ? item.sum / item.count
            : 0
          : item.sum,
  }));
};

const formatMetric = (value) => {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 1000) {
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
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
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
        {formatMetric(value)}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {widget.config.valueColumn ? `Column: ${widget.config.valueColumn}` : 'Select a numeric column'}
      </p>
    </div>
  );
}

function WidgetChart({ widget, rows }) {
  const chartData = computeChartMetric(rows, widget.config).slice(
    0,
    Number(widget.config.maxItems || 12)
  );

  const chartType = widget.config.chartType;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-semibold text-slate-700">{widget.title}</h4>

      <div className="h-72 md:h-80">
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
  const [layers, setLayers] = useState({
    layer1: [],
    layer2: [],
    layer3: [],
    layer4: [],
  });

  const [selectedWidgetId, setSelectedWidgetId] = useState('');
  const [draggingWidgetType, setDraggingWidgetType] = useState('');
  const [activeDropLayer, setActiveDropLayer] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);

  useEffect(() => {
    if (id) fetchDashboard(id);
  }, [id, fetchDashboard]);

  useEffect(() => {
    const loadRows = async () => {
      setLoading(true);

      try {
        const response = await excelApi.getByDashboardId(id);
        const records = normalizeRecords(response).filter((item) => item && typeof item === 'object');
        const merged = records.flatMap((item) => {
          if (Array.isArray(item.processedData) && item.processedData.length) {
            return item.processedData;
          }
          return buildMappedRows(item.rawData, item.columnMapping);
        });

        setRows(merged);
      } catch (error) {
        toast.error(formatApiError(error));
      } finally {
        setLoading(false);
      }
    };

    if (id) loadRows();
  }, [id]);

  const flattenLayerWidgets = (layerMap) =>
    LAYER_SPECS.flatMap((layer) => (Array.isArray(layerMap?.[layer.id]) ? layerMap[layer.id] : []));

  useEffect(() => {
    const savedLayers = currentDashboard?.layout?.layers;

    if (savedLayers && typeof savedLayers === 'object') {
      const normalizedLayers = {
        layer1: Array.isArray(savedLayers.layer1) ? savedLayers.layer1 : [],
        layer2: Array.isArray(savedLayers.layer2) ? savedLayers.layer2 : [],
        layer3: Array.isArray(savedLayers.layer3) ? savedLayers.layer3 : [],
        layer4: Array.isArray(savedLayers.layer4) ? savedLayers.layer4 : [],
      };

      setLayers(normalizedLayers);

      const first = flattenLayerWidgets(normalizedLayers)[0];
      setSelectedWidgetId(first?.id || '');
      return;
    }

    const savedWidgets = Array.isArray(currentDashboard?.layout?.widgets)
      ? currentDashboard.layout.widgets
      : [];

    const migrated = { layer1: [], layer2: [], layer3: [], layer4: [] };

    savedWidgets.forEach((widget) => {
      if (!widget?.id) return;
      if (widget.layerId && migrated[widget.layerId]) {
        const spec = LAYER_SPECS.find((layer) => layer.id === widget.layerId);
        if (spec && migrated[widget.layerId].length < spec.maxItems) {
          migrated[widget.layerId].push(widget);
          return;
        }
      }

      if (widget.kind === 'chart') {
        if (migrated.layer3.length < 2) migrated.layer3.push(widget);
        else if (migrated.layer4.length < 2) migrated.layer4.push(widget);
      } else if (migrated.layer1.length < 4) {
        migrated.layer1.push(widget);
      } else if (migrated.layer2.length < 4) {
        migrated.layer2.push(widget);
      }
    });

    setLayers(migrated);

    const first = flattenLayerWidgets(migrated)[0];
    setSelectedWidgetId(first?.id || '');
  }, [currentDashboard?._id, currentDashboard?.updatedAt, currentDashboard?.layout]);

  const columns = useMemo(() => {
    const set = new Set();

    rows.slice(0, 200).forEach((row) => {
      Object.keys(row || {}).forEach((key) => {
        if (!INTERNAL_COLUMNS.has(key)) set.add(key);
      });
    });

    return Array.from(set);
  }, [rows]);

  const numericColumns = useMemo(() => {
    return columns.filter((column) => rows.some((row) => isNumericValue(row?.[column])));
  }, [columns, rows]);

  const widgets = useMemo(() => flattenLayerWidgets(layers), [layers]);

  const selectedWidget = widgets.find((item) => item.id === selectedWidgetId) || null;

  const makeWidget = (libraryType) => {
    const spec = WIDGET_LIBRARY.find((item) => item.type === libraryType);

    if (!spec) return null;

    const numericDefault = numericColumns[0] || '';
    const groupDefault = columns[0] || '';

    const baseWidget = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: spec.type,
      kind: spec.kind,
      title: spec.label,
      config: {},
    };

    baseWidget.config =
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
          };

    return baseWidget;
  };

  const addWidget = (libraryType, targetLayerId = null) => {
    const widget = makeWidget(libraryType);

    if (!widget) return;

    const layerSpec = targetLayerId
      ? LAYER_SPECS.find((layer) => layer.id === targetLayerId)
      : LAYER_SPECS.find((layer) => layer.kind === widget.kind && layers[layer.id].length < layer.maxItems);

    if (!layerSpec) {
      toast.error(`No available ${widget.kind} layer slot`);
      return;
    }

    if (layerSpec.kind !== widget.kind) {
      toast.error(`Only ${layerSpec.kind} widgets are allowed in ${layerSpec.title}`);
      return;
    }

    if ((layers[layerSpec.id] || []).length >= layerSpec.maxItems) {
      toast.error(`${layerSpec.title} supports up to ${layerSpec.maxItems} widgets`);
      return;
    }

    setLayers((prev) => ({
      ...prev,
      [layerSpec.id]: [...(prev[layerSpec.id] || []), { ...widget, layerId: layerSpec.id }],
    }));

    setSelectedWidgetId(widget.id);
  };

  const updateSelectedWidget = (patch) => {
    if (!selectedWidgetId) return;

    setLayers((prev) => {
      const next = { ...prev };

      LAYER_SPECS.forEach((layer) => {
        next[layer.id] = (next[layer.id] || []).map((widget) =>
          widget.id === selectedWidgetId ? { ...widget, ...patch } : widget
        );
      });

      return next;
    });
  };

  const updateSelectedWidgetConfig = (patch) => {
    if (!selectedWidgetId) return;

    setLayers((prev) => {
      const next = { ...prev };

      LAYER_SPECS.forEach((layer) => {
        next[layer.id] = (next[layer.id] || []).map((widget) =>
          widget.id === selectedWidgetId
            ? { ...widget, config: { ...widget.config, ...patch } }
            : widget
        );
      });

      return next;
    });
  };

  const removeWidget = (widgetId) => {
    setLayers((prev) => {
      const next = { ...prev };

      LAYER_SPECS.forEach((layer) => {
        next[layer.id] = (next[layer.id] || []).filter((widget) => widget.id !== widgetId);
      });

      return next;
    });

    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId('');
    }
  };

  const saveLayout = async () => {
    if (!id) return;

    setSavingLayout(true);

    try {
      const widgetsToSave = LAYER_SPECS.flatMap((layer) =>
        (layers[layer.id] || []).map((widget) => ({ ...widget, layerId: layer.id }))
      );

      await updateDashboard(id, {
        layout: {
          widgets: widgetsToSave,
          filters: currentDashboard?.layout?.filters || [],
          charts: currentDashboard?.layout?.charts || [],
        },
      });

      toast.success('Dashboard layout saved');
    } catch (error) {
      toast.error(formatApiError(error));
    } finally {
      setSavingLayout(false);
    }
  };

  const handleDragStart = (event, widgetType) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('widgetType', widgetType);
    event.dataTransfer.setData('text/plain', widgetType);
    setDraggingWidgetType(widgetType);
  };

  const handleDragEnd = () => {
    setDraggingWidgetType('');
    setActiveDropLayer('');
  };

  const handleDropOnLayer = (event, layerId) => {
    event.preventDefault();
    event.stopPropagation();

    const type =
      event.dataTransfer.getData('widgetType') ||
      event.dataTransfer.getData('text/plain') ||
      draggingWidgetType;

    setDraggingWidgetType('');
    setActiveDropLayer('');

    if (!type) {
      toast.error('Widget type not found. Please drag again.');
      return;
    }

    addWidget(type, layerId);
  };

  const canDropWidgetOnLayer = (layerId) => {
    const widgetSpec = WIDGET_LIBRARY.find((item) => item.type === draggingWidgetType);
    const layerSpec = LAYER_SPECS.find((layer) => layer.id === layerId);

    if (!widgetSpec || !layerSpec) return true;

    return widgetSpec.kind === layerSpec.kind;
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
          <section className="min-h-[70vh] rounded-2xl border border-slate-200 bg-white p-5">
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
            ) : (
              <div className="space-y-5">
                {widgets.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm text-slate-500">
                    Drag a widget from the right side and drop it into one of the layers below.
                  </div>
                ) : null}

                {LAYER_SPECS.map((layer) => {
                  const layerWidgets = layers[layer.id] || [];
                  const isActive = activeDropLayer === layer.id;
                  const isValidDrop = canDropWidgetOnLayer(layer.id);

                  return (
                    <div
                      key={layer.id}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setActiveDropLayer(layer.id);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = isValidDrop ? 'copy' : 'none';
                      }}
                      onDragLeave={() => {
                        setActiveDropLayer('');
                      }}
                      onDrop={(event) => handleDropOnLayer(event, layer.id)}
                      className={`rounded-xl border border-dashed p-4 transition ${
                        isActive
                          ? isValidDrop
                            ? 'border-primary-400 bg-primary-50'
                            : 'border-red-300 bg-red-50'
                          : 'border-slate-300 bg-slate-50'
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">
                          {layer.title} ({layer.kind}s)
                        </h3>

                        <span className="text-xs text-slate-500">
                          {layerWidgets.length}/{layer.maxItems}
                        </span>
                      </div>

                      {layerWidgets.length === 0 ? (
                        <p className="rounded-lg border border-slate-200 bg-white p-5 text-center text-xs text-slate-500">
                          Drop up to {layer.maxItems} {layer.kind} widget(s) here.
                        </p>
                      ) : (
                        <div
                          className={
                            layer.kind === 'card'
                              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'
                              : 'grid grid-cols-1 gap-4 lg:grid-cols-2'
                          }
                        >
                          {layerWidgets.map((widget) => (
                            <div
                              key={widget.id}
                              role="button"
                              tabIndex={0}
                              className={`relative rounded-xl ${
                                selectedWidgetId === widget.id ? 'ring-2 ring-primary-400' : ''
                              }`}
                              onClick={() => setSelectedWidgetId(widget.id)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') setSelectedWidgetId(widget.id);
                              }}
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
                    </div>
                  );
                })}
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
                    onDragStart={(event) => handleDragStart(event, item.type)}
                    onDragEnd={handleDragEnd}
                    onClick={() => addWidget(item.type)}
                    className="w-full cursor-grab rounded-xl border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 active:cursor-grabbing"
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
                    onChange={(event) =>
                      updateSelectedWidgetConfig({ calculation: event.target.value })
                    }
                    options={CALC_OPTIONS}
                    placeholder="Choose calculation"
                  />

                  <Select
                    label="Column to calculate"
                    value={selectedWidget.config.valueColumn}
                    onChange={(event) =>
                      updateSelectedWidgetConfig({ valueColumn: event.target.value })
                    }
                    options={numericColumns.map((column) => ({ value: column, label: column }))}
                    placeholder="Numeric column"
                  />

                  {selectedWidget.kind === 'chart' ? (
                    <>
                      <Select
                        label="Chart type"
                        value={selectedWidget.config.chartType}
                        onChange={(event) =>
                          updateSelectedWidgetConfig({ chartType: event.target.value })
                        }
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
                        onChange={(event) =>
                          updateSelectedWidgetConfig({ groupColumn: event.target.value })
                        }
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
                    onChange={(event) =>
                      updateSelectedWidgetConfig({ filterColumn: event.target.value })
                    }
                    options={columns.map((column) => ({ value: column, label: column }))}
                    placeholder="No filter"
                  />

                  <Input
                    label="Optional filter value"
                    value={selectedWidget.config.filterValue}
                    onChange={(event) =>
                      updateSelectedWidgetConfig({ filterValue: event.target.value })
                    }
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
