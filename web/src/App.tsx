import { useRoute } from './lib/route';
import { Dashboard } from './screens/Dashboard';
import { ProjectDetail } from './screens/ProjectDetail';

export default function App() {
  const route = useRoute();
  if (route.name === 'detail') return <ProjectDetail id={route.id} />;
  return <Dashboard />;
}
