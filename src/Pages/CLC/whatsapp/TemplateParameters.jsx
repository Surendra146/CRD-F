const fields = ['name', 'phone', 'email', 'city', 'lifecycle.segment', 'lifecycle.totalSpent', 'demographics.city'];

export default function TemplateParameters({ scopes, mappings, onChange }) {
  return scopes.map(([scope, count]) => <div key={scope} className="space-y-2">
    <p className="text-sm">{scope} parameters</p>
    {Array.from({ length: count }, (_, index) => {
      const selected = mappings[scope]?.[index];
      const update = value => {
        const values = [...(mappings[scope] || Array(count).fill(''))];
        values[index] = value;
        onChange({ ...mappings, [scope]: values });
      };
      return <div key={index} className="flex flex-wrap gap-2">
        <select aria-label={`${scope} parameter ${index + 1} recipient field`} className="rounded border p-2" value={typeof selected === 'string' ? selected : ''} onChange={event => update(event.target.value)}>
          <option value="">Choose recipient field or enter a value</option>
          {fields.map(field => <option key={field}>{field}</option>)}
        </select>
        <input aria-label={`${scope} parameter ${index + 1} fixed value`} className="rounded border p-2" placeholder="Fixed value for this campaign" value={selected?.value || ''} onChange={event => update({ value: event.target.value })} />
      </div>;
    })}
  </div>);
}
