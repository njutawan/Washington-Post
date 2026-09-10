const MAP: Record<string, string> = {
  idea: 'bg-gray-200 text-gray-800',
  pitched: 'bg-blue-100 text-blue-900',
  assigned: 'bg-purple-100 text-purple-900',
  drafting: 'bg-yellow-100 text-yellow-900',
  editing: 'bg-orange-100 text-orange-900',
  ready: 'bg-green-100 text-green-900',
  published: 'bg-wp-black text-white',
  killed: 'bg-red-100 text-red-900',
};
const LABEL: Record<string, string> = {
  idea: 'Idea',
  pitched: 'Pitched',
  assigned: 'Assigned',
  drafting: 'Drafting',
  editing: 'In edit',
  ready: 'Ready',
  published: 'Published',
  killed: 'Spiked',
};

export default function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[9px] uppercase tracking-widest font-bold ${MAP[status] || 'bg-gray-200'}`}>
      {LABEL[status] || status}
    </span>
  );
}
