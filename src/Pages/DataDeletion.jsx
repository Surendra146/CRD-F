import { useEffect } from 'react';

export default function DataDeletion() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Data Deletion | HanuRam Tech';
    return () => { document.title = previousTitle; };
  }, []);

  return (
    <iframe
      title="HanuRam Tech Data Deletion Instructions"
      src="/data-deletion/index.html"
      className="fixed inset-0 h-full w-full border-0 bg-slate-50"
    />
  );
}