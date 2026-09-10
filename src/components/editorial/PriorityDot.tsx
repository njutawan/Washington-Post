const COLOR: Record<string, string> = {
  breaking: 'bg-wp-red animate-pulse',
  urgent: 'bg-orange-500',
  routine: 'bg-gray-300',
};
const LABEL: Record<string, string> = { breaking: 'Breaking', urgent: 'Urgent', routine: 'Routine' };

export default function PriorityDot({ priority }: { priority: string }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${COLOR[priority] || COLOR.routine}`} title={LABEL[priority] || 'Routine'} aria-label={LABEL[priority] || 'Routine'} />
  );
}
