import { Scenario } from '@/lib/scenarios';

interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: () => void;
}

export default function ScenarioCard({ scenario, onSelect }: ScenarioCardProps) {
  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all text-center w-full"
      aria-label={`Selecionar cenário: ${scenario.name}`}
    >
      <span className="text-3xl">{scenario.icon}</span>
      <span className="font-semibold text-gray-800 text-sm leading-tight">{scenario.name}</span>
    </button>
  );
}
