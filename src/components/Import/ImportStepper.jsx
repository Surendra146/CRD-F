import { ArrowRight, CheckCircle } from 'lucide-react';

import { importSteps } from './importConstants';

export default function ImportStepper({ step }) {
  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-center justify-center gap-y-3">
        {importSteps.map((item, index) => (
          <div key={item.num} className="flex items-center" aria-label={item.label} aria-current={step === item.num ? "step" : undefined}>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                step >= item.num
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              {step > item.num ? <CheckCircle className="h-5 w-5" /> : item.num}
            </div>
            <span
              className={`ml-2 hidden sm:inline text-sm font-medium ${
                step >= item.num ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {item.label}
            </span>
            {index < importSteps.length - 1 ? (
              <ArrowRight className="mx-2 sm:mx-4 h-5 w-5 shrink-0 text-gray-300" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
