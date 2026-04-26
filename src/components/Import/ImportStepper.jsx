import { ArrowRight, CheckCircle } from 'lucide-react';

import { importSteps } from './importConstants';

export default function ImportStepper({ step }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        {importSteps.map((item, index) => (
          <div key={item.num} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                step >= item.num
                  ? 'border-primary-600 bg-primary-600 text-white'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              {step > item.num ? <CheckCircle className="h-5 w-5" /> : item.num}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
                step >= item.num ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              {item.label}
            </span>
            {index < importSteps.length - 1 ? (
              <ArrowRight className="mx-4 h-5 w-5 text-gray-300" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
