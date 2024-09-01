import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useState } from "react";

const exampleText =
  "Don't believe in the me who believes in you. Don't believe in the you who believes in me. Believe in the you who believes in yourself!";

type Word = {
  word: string;
  punctuation: string | null;
};

function App() {
  const availablePunctuations = [",", ".", "?", "!"];

  const [answer, setAnswer] = useState<Word[]>(textWithoutFormat(exampleText));
  const [isSomethingDragged, setIsSomethingDragged] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
  );

  function removePunctuation(text: string): string {
    return text.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
  }

  function textWithoutFormat(text: string) {
    const plainText =
      removePunctuation(text).charAt(0) +
      removePunctuation(text).slice(1).toLowerCase();

    return plainText.split(" ").map((word) => ({
      word: word,
      punctuation: null,
    }));
  }

  const handleDragStart = useCallback(() => {
    setIsSomethingDragged(true);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over?.id) {
        return setIsSomethingDragged(false);
      }

      const dropzoneId = +over?.id;

      const word = answer[dropzoneId];
      const nextWord = answer[dropzoneId + 1];

      word.punctuation = active.data.current?.punctuation;

      if (
        nextWord &&
        [".", "?", "!"].includes(active.data.current?.punctuation)
      ) {
        nextWord.word =
          nextWord.word.charAt(0).toUpperCase() + nextWord.word.slice(1);
      }

      setAnswer([...answer]);
      setIsSomethingDragged(false);
    },
    [answer],
  );

  function submitAnswer() {
    const answerText = answer
      .map((word) => word.word + (word.punctuation ?? ""))
      .join(" ");

    console.log(answerText, exampleText, answerText === exampleText);
  }

  return (
    <div className="m-auto flex h-dvh max-w-2xl flex-col justify-center gap-8">
      <header className="flex items-center justify-between gap-4">
        <p className="text-2xl font-bold">Practice time</p>
      </header>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToFirstScrollableAncestor]}
      >
        <div className="relative -mx-4 flex flex-wrap rounded border-2 border-orange-200 p-4 pt-6">
          <small className="absolute -top-4 left-2 rounded bg-orange-200 px-2 py-1 font-semibold text-orange-700">
            Add the punctuations to the text
          </small>
          {answer.map((word, index) => (
            <Word
              key={index}
              id={index.toString()}
              word={word}
              index={index}
              isDragging={!!isSomethingDragged}
            />
          ))}
        </div>

        <div className="flex justify-between">
          <div className="grid w-fit grid-cols-4 gap-2">
            {availablePunctuations.map((symbol) => (
              <InsertSymbol
                key={symbol}
                symbol={symbol}
                onClick={() => setIsSomethingDragged(true)}
              />
            ))}
          </div>
          <div className="flex items-center gap-6">
            <button
              className="w-fit rounded text-sm text-neutral-400 hover:text-slate-700"
              onClick={() => {
                setAnswer(textWithoutFormat(exampleText));
                setIsSomethingDragged(false);
              }}
            >
              reset
            </button>
            <button
              className="h-[32px] w-fit rounded bg-slate-900 px-4 text-sm text-slate-100"
              onClick={submitAnswer}
            >
              submit
            </button>
          </div>
        </div>
      </DndContext>
    </div>
  );
}

type SortableItemProps = {
  id: string;
  word: Word;
  index: number;
  isDragging: boolean; // item in general, not this specific item
};

const Word = (props: SortableItemProps) => {
  const { setNodeRef: droppableRef } = useDroppable({ id: props.id });

  return (
    <div className="flex">
      <p>{props.word?.word}</p>
      <p
        style={{
          borderBottom: props.isDragging
            ? "2px solid #fb923c"
            : "2px solid transparent",
          color: props.isDragging ? "#c2410c" : undefined,
          marginRight: props.word.punctuation ? "8px" : "",
        }}
        ref={droppableRef}
      >
        {props.word.punctuation ? (
          <span className="grid h-fit w-4 place-content-center rounded border-b-orange-400 bg-orange-100 text-orange-700">
            {props.word.punctuation}
          </span>
        ) : (
          <span className="block w-2"></span>
        )}
      </p>
    </div>
  );
};

type SymbolProps = {
  symbol: string;
  onClick: () => void;
};

const InsertSymbol = (props: SymbolProps) => {
  const { symbol } = props;
  const { setNodeRef, attributes, listeners, transform } = useDraggable({
    id: symbol,
    data: {
      punctuation: symbol,
    },
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ transform: CSS.Transform.toString(transform) }}
      className="grid aspect-square w-8 place-content-center rounded bg-slate-900 p-1 text-sm text-slate-100 shadow duration-150 hover:scale-110"
    >
      {symbol}
    </button>
  );
};

export default App;
