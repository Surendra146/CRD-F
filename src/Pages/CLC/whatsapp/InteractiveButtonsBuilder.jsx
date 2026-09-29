import { Plus, Trash2, Globe, Phone, MessageSquare } from 'lucide-react';
import Button from '../../../components/UI/button.jsx';

export default function InteractiveButtonsBuilder({ buttons = [], onChange }) {
  const addButton = (type = 'quick_reply') => {
    if (buttons.length >= 3) return;
    const newBtn = {
      id: `btn_${Date.now()}`,
      type,
      text: type === 'quick_reply' ? 'Interested' : type === 'url' ? 'Visit Website' : 'Call Sales',
      value: type === 'url' ? 'https://example.com' : type === 'phone_number' ? '+919876543210' : 'quick_reply',
    };
    onChange([...buttons, newBtn]);
  };

  const removeButton = (index) => {
    onChange(buttons.filter((_, idx) => idx !== index));
  };

  const updateButton = (index, field, value) => {
    const updated = [...buttons];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <span>Interactive WhatsApp Buttons</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
              {buttons.length}/3 Added
            </span>
          </p>
          <p className="text-xs text-gray-500">
            Send Quick Reply buttons or Call-to-Action (URL / Phone) buttons with your message
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addButton('quick_reply')}
            disabled={buttons.length >= 3}
          >
            <MessageSquare className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
            + Quick Reply
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addButton('url')}
            disabled={buttons.length >= 3}
          >
            <Globe className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
            + URL Link
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => addButton('phone_number')}
            disabled={buttons.length >= 3}
          >
            <Phone className="mr-1.5 h-3.5 w-3.5 text-green-600" />
            + Call Button
          </Button>
        </div>
      </div>

      {buttons.length > 0 ? (
        <div className="space-y-2">
          {buttons.map((btn, idx) => (
            <div
              key={btn.id || idx}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2.5 shadow-xs"
            >
              <span className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 uppercase">
                {btn.type === 'url' && <Globe className="h-3 w-3 text-indigo-600" />}
                {btn.type === 'phone_number' && <Phone className="h-3 w-3 text-green-600" />}
                {btn.type === 'quick_reply' && <MessageSquare className="h-3 w-3 text-blue-600" />}
                {btn.type.replace('_', ' ')}
              </span>

              <input
                type="text"
                placeholder="Button Label (e.g. Claim Offer)"
                value={btn.text}
                onChange={(e) => updateButton(idx, 'text', e.target.value)}
                className="flex-1 min-w-[130px] rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />

              {btn.type !== 'quick_reply' && (
                <input
                  type="text"
                  placeholder={btn.type === 'url' ? 'https://yourwebsite.com' : '+919876543210'}
                  value={btn.value}
                  onChange={(e) => updateButton(idx, 'value', e.target.value)}
                  className="flex-1 min-w-[170px] rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              )}

              <button
                type="button"
                onClick={() => removeButton(idx)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                title="Remove button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No buttons added. Click above to attach up to 3 interactive buttons.</p>
      )}
    </div>
  );
}
