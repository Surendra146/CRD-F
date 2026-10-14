import { progressSteps, statusLabel } from '../../services/onboarding';

export default function WhatsAppOnboardingProgress({ request }) {
  const steps = request.required_action || request.history?.some((event) => event.event === 'action_required')
    ? progressSteps : progressSteps.filter((step) => step !== 'action_required');
  const index = steps.indexOf(request.status);
  return <ol aria-label="WhatsApp setup progress" className="my-4 flex flex-wrap gap-3">
    {steps.map((step, position) => <li key={step} aria-current={step === request.status ? 'step' : undefined}
      className={`rounded-xl border px-3 py-2 text-sm ${position < index || request.status === 'connected' ? 'border-green-200 bg-green-50 text-green-800' : step === request.status ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-500'}`}>
      {position + 1}. {statusLabel(step)}
    </li>)}
  </ol>;
}
