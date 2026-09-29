import { useState } from 'react';
import { Sparkles, HelpCircle, Shuffle } from 'lucide-react';

export function resolveSpintaxClient(text) {
  let result = text || '';
  const regex = /(?<!\{)\{([^{}]+?\|[^{}]+?)\}(?!\})/g;
  while (regex.test(result)) {
    result = result.replace(regex, (_, choices) => {
      const parts = choices.split('|');
      return parts[Math.floor(Math.random() * parts.length)];
    });
  }
  return result;
}

export default function SpintaxHelper({ message, onInsertToken, onApplyVariation }) {
  const [showSpintaxGuide, setShowSpintaxGuide] = useState(false);
  const [sampleVariations, setSampleVariations] = useState([]);

  const tokens = [
    { label: 'Name', value: '{{name}}' },
    { label: 'Phone', value: '{{phone}}' },
    { label: 'City', value: '{{city}}' },
    { label: 'Segment', value: '{{segment}}' },
    { label: 'Total Spent', value: '{{total_spent}}' },
  ];

  const generateSamples = () => {
    if (!message) return;
    const samples = [];
    for (let i = 0; i < 3; i++) {
      let sample = resolveSpintaxClient(message);
      sample = sample
        .replace(/\{\{\s*name\s*\}\}/gi, 'Rahul')
        .replace(/\{\{\s*phone\s*\}\}/gi, '+91 98765 43210')
        .replace(/\{\{\s*city\s*\}\}/gi, 'Hyderabad')
        .replace(/\{\{\s*segment\s*\}\}/gi, 'VIP')
        .replace(/\{\{\s*total_spent\s*\}\}/gi, '₹1,500');
      samples.push(sample);
    }
    setSampleVariations(samples);
  };

  return (
    <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-gray-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-blue-900">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span>Personalization Tags & Spintax Anti-Ban</span>
        </div>
        <button
          type="button"
          onClick={() => setShowSpintaxGuide(!showSpintaxGuide)}
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>{showSpintaxGuide ? 'Hide Guide' : 'How Spintax Works'}</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-gray-500 mr-1">Insert dynamic tag:</span>
        {tokens.map((tok) => (
          <button
            key={tok.value}
            type="button"
            onClick={() => onInsertToken(tok.value)}
            className="rounded-md border border-blue-200 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-blue-700 shadow-xs hover:border-blue-300 hover:bg-blue-100 transition-colors"
          >
            {tok.value}
          </button>
        ))}
      </div>

      {showSpintaxGuide && (
        <div className="rounded-lg border border-blue-200 bg-white p-3 space-y-1.5 text-gray-600">
          <p className="font-semibold text-blue-900">Prevent WhatsApp bans with Spintax:</p>
          <p>
            Use <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-700">&#123;Option 1|Option 2|Option 3&#125;</code> in your message. Each recipient receives a randomly selected variation so all messages appear unique!
          </p>
          <p className="text-[11px] text-gray-500 italic">
            Example: <code className="bg-gray-100 px-1 py-0.5 rounded">&#123;Hello|Hi|Greetings&#125; &#123;&#123;name&#125;&#125;, &#123;we have an exclusive deal|check out our special offer&#125; for you!</code>
          </p>
        </div>
      )}

      {message && message.includes('{') && message.includes('|') && (
        <div className="pt-1">
          <button
            type="button"
            onClick={generateSamples}
            className="flex items-center gap-1.5 rounded border border-blue-300 bg-white px-2.5 py-1 text-blue-700 hover:bg-blue-50 font-medium"
          >
            <Shuffle className="h-3.5 w-3.5" />
            <span>Test Random Spintax Variations</span>
          </button>

          {sampleVariations.length > 0 && (
            <div className="mt-2 space-y-1 rounded border border-gray-200 bg-white p-2.5">
              <p className="font-medium text-gray-800 text-[11px]">Generated recipient samples:</p>
              {sampleVariations.map((samp, idx) => (
                <div key={idx} className="rounded bg-gray-50 p-1.5 font-mono text-[11px] text-gray-700 border border-gray-100">
                  <span className="font-semibold text-blue-600 mr-1.5">Recipient {idx + 1}:</span>
                  "{samp}"
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
