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

  const punctuationCountInit = availablePunctuations.reduce(
    (acc, punctuation) => {
      acc[punctuation] = {
        example: exampleText.split(punctuation).length - 1,
        answer: 0,
      };
      return acc;
    },
    {} as Record<string, { example: number; answer: number }>,
  );

  const [answer, setAnswer] = useState<Word[]>(textWithoutFormat(exampleText));
  const [isSomethingDragged, setIsSomethingDragged] = useState(false);
  const [punctuationCount, setPunctuationCount] =
    useState(punctuationCountInit);
  const [answerState, setAnswerState] = useState("in-progress");

  const isEveryPunctuationFilled = Object.keys(punctuationCount).every(
    (punctuation) =>
      punctuationCount[punctuation].answer ===
      punctuationCount[punctuation].example,
  )
    ? false
    : true;

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

      setIsSomethingDragged(false);

      // update position of the punctuation and lowercase the next word
      // Note: might be better to compare it to the original text, because you might not always want to lowercase the word in case of names and places
      if (!over?.id || answer[active.data.current?.wordIndex]) {
        answer[active.data.current?.wordIndex].punctuation = null;

        answer[active.data.current?.wordIndex + 1].word =
          answer[active.data.current?.wordIndex + 1].word
            .charAt(0)
            .toLowerCase() +
          answer[active.data.current?.wordIndex + 1].word.slice(1);

        if (event.active.data.current?.punctuation) {
          setPunctuationCount((prev) => ({
            ...prev,
            [event.active.data.current?.punctuation]: {
              ...prev[event.active.data.current?.punctuation],
              answer: prev[event.active.data.current?.punctuation].answer - 1,
            },
          }));
        }
      }

      // if we are not dragging above a dropzone, then do nothing
      if (!over?.id) {
        return setIsSomethingDragged(false);
      }

      const dropzoneId = +over?.id;

      const word = answer[dropzoneId];
      const nextWord = answer[dropzoneId + 1];

      if (event.active.data.current?.punctuation && !word.punctuation) {
        word.punctuation = active.data.current?.punctuation;
        setPunctuationCount((prev) => ({
          ...prev,
          [event.active.data.current?.punctuation]: {
            ...prev[event.active.data.current?.punctuation],
            answer: prev[event.active.data.current?.punctuation].answer + 1,
          },
        }));
      }

      if (
        nextWord &&
        [".", "?", "!"].includes(active.data.current?.punctuation)
      ) {
        nextWord.word =
          nextWord.word.charAt(0).toUpperCase() + nextWord.word.slice(1);
      }

      setAnswer([...answer]);
    },
    [answer],
  );

  function submitAnswer() {
    const answerText = answer
      .map((word) => word.word + (word.punctuation ?? ""))
      .join(" ");

    setAnswerState(answerText === exampleText ? "correct" : "incorrect");
  }

  return (
    <div className="m-auto flex h-dvh max-w-3xl flex-col justify-center gap-8">
      <header className="flex items-center justify-between gap-4">
        <p className="text-2xl font-bold">Practice time 🧐</p>
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
              isSomethingDragged={!!isSomethingDragged}
            />
          ))}
        </div>

        <div className="flex justify-between">
          <div className="grid w-fit grid-cols-4 gap-4">
            {Object.keys(punctuationCount)
              .filter(
                (punctuation) => punctuationCount[punctuation].example > 0,
              )
              .map((symbol) => (
                <InsertSymbol
                  key={symbol}
                  symbol={symbol}
                  usedPunctuations={punctuationCount}
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
                setPunctuationCount(punctuationCountInit);
                setAnswerState("in-progress");
              }}
            >
              reset
            </button>
            <button
              className="h-[32px] w-fit rounded bg-slate-900 px-4 text-sm text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={submitAnswer}
              disabled={isEveryPunctuationFilled}
            >
              submit
            </button>
          </div>
        </div>

        {answerState === "correct" && (
          <p className="-mx-4 rounded bg-green-200 px-4 py-2 text-sm text-green-500">
            Correct! ✅
          </p>
        )}
        {answerState === "incorrect" && (
          <p className="-mx-4 rounded bg-red-200 px-4 py-2 text-sm text-red-500">
            Incorrect! ❌
          </p>
        )}
      </DndContext>
    </div>
  );
}

type WordProps = {
  id: string;
  word: Word;
  index: number;
  isSomethingDragged: boolean; // item in general, not this specific item
};

const Word = (props: WordProps) => {
  const {
    setNodeRef: draggableRef,
    attributes,
    listeners,
    transform,
  } = useDraggable({
    id: `${props.index}-${props.word.punctuation}`,
    data: {
      wordIndex: props.index,
      punctuation: props.word.punctuation,
    },
  });
  const { setNodeRef: droppableRef } = useDroppable({
    id: props.id,
  });

  return (
    <div className="flex">
      <p>{props.word?.word}</p>
      <p
        style={{
          borderBottom: props.isSomethingDragged
            ? "2px solid #fb923c"
            : "2px solid transparent",
          color: props.isSomethingDragged ? "#c2410c" : undefined,
          marginRight: props.word.punctuation ? "8px" : "",
          transform: props.word.punctuation
            ? CSS.Transform.toString(transform)
            : undefined,
        }}
        ref={
          // if nothing is filled or you update a punctuation, then it's a droppable otherwise it's a draggable
          !props.word.punctuation || props.isSomethingDragged
            ? droppableRef
            : draggableRef
        }
        {...attributes}
        {...listeners}
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
  usedPunctuations: Record<string, { example: number; answer: number }>;
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

  const isDisabled =
    props.usedPunctuations[symbol].answer ===
    props.usedPunctuations[symbol].example;

  return (
    <div className="flex items-center gap-1 text-sm">
      <p>{`${props.usedPunctuations[symbol].answer}/${props.usedPunctuations[symbol].example}`}</p>
      <button
        ref={setNodeRef}
        {...(!isDisabled && attributes)}
        {...(!isDisabled && listeners)}
        style={{
          transform: CSS.Transform.toString(transform),
          opacity: isDisabled ? 0.25 : 1,
        }}
        className="grid aspect-square w-8 place-content-center rounded bg-slate-900 p-1 text-sm text-slate-100 shadow duration-150 hover:scale-110"
      >
        {symbol}
      </button>
    </div>
  );
};

export default App;
