import { Waves } from 'lucide-react';

export default function Empty({ messages }: { messages: string }) {
  return <div className="dashboard-empty"><span className="dashboard-empty-icon"><Waves size={32} aria-hidden="true" /></span><p>{messages}</p></div>;
}
