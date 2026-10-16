import { getEditorialUser } from '@/lib/getEditorialUser';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
export const dynamic = 'force-dynamic';
export default async function Page() { await getEditorialUser('editor'); return <AnalyticsDashboard />; }
