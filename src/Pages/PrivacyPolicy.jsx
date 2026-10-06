import { useEffect } from 'react';

// Fallback for existing Render sites whose SPA rewrite has not been updated.
// The policy remains a standalone document with one source of content.
export default function PrivacyPolicy() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Privacy Policy | CustomerLoop';
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <iframe
      title="CustomerLoop Privacy Policy — HanuRam Tech"
      src="/privacy-policy/index.html"
      className="fixed inset-0 h-full w-full border-0 bg-slate-50"
    />
  );
}
