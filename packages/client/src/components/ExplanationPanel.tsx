interface Props {
  explanation: string[];
  maxItems?: number;
}

export default function ExplanationPanel({ explanation, maxItems }: Props) {
  if (explanation.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        Run consensus to see explanation
      </p>
    );
  }

  const items = maxItems !== undefined ? explanation.slice(0, maxItems) : explanation;

  return (
    <ul className="space-y-2">
      {items.map((sentence, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
          <svg
            className="h-4 w-4 flex-shrink-0 mt-0.5 text-indigo-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>{sentence}</span>
        </li>
      ))}
    </ul>
  );
}
