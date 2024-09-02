import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type DraggableSymbolProps = {
  symbol: string;
  punctuationUsage: Record<string, { example: number; answer: number }>;
};

export const DraggableSymbol = (props: DraggableSymbolProps) => {
  const { symbol, punctuationUsage } = props;
  const { setNodeRef, attributes, listeners, transform } = useDraggable({
    id: symbol,
    data: { punctuation: symbol },
  });

  const symbolsUsed = punctuationUsage[symbol].answer;
  const symbolsInTotal = punctuationUsage[symbol].example;

  const isSymbolDisabled = symbolsUsed === symbolsInTotal;

  return (
    <div className="flex items-center gap-2 text-sm">
      <p>{`${symbolsUsed}/${symbolsInTotal}`}</p>
      <button
        ref={setNodeRef}
        className="grid aspect-square w-8 place-content-center rounded bg-slate-900 p-1 text-sm text-slate-100 shadow duration-150 hover:scale-110"
        style={{
          transform: CSS.Transform.toString(transform),
          opacity: isSymbolDisabled ? 0.25 : 1,
        }}
        {...(!isSymbolDisabled && attributes)} // drag attributes
        {...(!isSymbolDisabled && listeners)} // drag events
      >
        {symbol}
      </button>
    </div>
  );
};
