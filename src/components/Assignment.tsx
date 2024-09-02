import {
  useSensors,
  useSensor,
  PointerSensor,
  DragEndEvent,
  DndContext,
} from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { useState, useCallback } from "react";
import { DraggableSymbol } from "./DraggableSymbol";
import { Word } from "./Word";
import { getAllPunctuation, makeTextPlain } from "../utils";

type AssignmentProps = {
  text: string;
};

export default function Assignment({ text }: Readonly<AssignmentProps>) {
  const punctuationCountInit = getAllPunctuation(text).reduce(
    (acc, punctuation) => {
      acc[punctuation] = {
        example: text.split(punctuation).length - 1,
        answer: 0,
      };
      return acc;
    },
    {} as Record<string, { example: number; answer: number }>,
  );

  const [answer, setAnswer] = useState<Word[]>(makeTextPlain(text));
  const [isSomethingDragged, setIsSomethingDragged] = useState(false);
  const [punctuationUsage, setPunctuationUsage] =
    useState(punctuationCountInit);
  const [answerState, setAnswerState] = useState("in-progress");

  const isEveryPunctuationFilled = Object.keys(punctuationUsage).every(
    (punctuation) =>
      punctuationUsage[punctuation].answer ===
      punctuationUsage[punctuation].example,
  )
    ? false
    : true;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 100, tolerance: 5 },
    }),
  );

  function updatePunctuationUsage(punctuation: string, isIncrement: boolean) {
    setPunctuationUsage((prev) => ({
      ...prev,
      [punctuation]: {
        ...prev[punctuation],
        answer: isIncrement
          ? prev[punctuation].answer + 1
          : prev[punctuation].answer - 1,
      },
    }));
  }

  const handleDragStart = useCallback(() => {
    setIsSomethingDragged(true);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      const currentWord = answer[active.data.current?.wordIndex];
      const nextWord = answer[active.data.current?.wordIndex + 1];
      const selectedPunctuation = active.data.current?.punctuation;

      // move already placed punctuation to a new dropzone
      if (!over?.id || currentWord) {
        // remove the punctuation from the current word
        currentWord.punctuation = null;

        // lowercase the next word, because the punctuation is removed
        if (nextWord) {
          nextWord.word =
            nextWord.word.charAt(0).toLowerCase() + nextWord.word.slice(1);
        }

        // update the punctuation usage
        updatePunctuationUsage(selectedPunctuation, false);
      }

      // if we are not dragging above a dropzone, then do nothing
      if (!over?.id) {
        return setIsSomethingDragged(false);
      }

      const dropzoneId = +over?.id;
      const wordDropzone = answer[dropzoneId];
      const nextWordDropzone = answer[dropzoneId + 1];

      // update the dropzone with the selected punctuation
      if (selectedPunctuation) {
        // increase the punctuation usage when a new punctuation is placed
        if (wordDropzone.punctuation) {
          updatePunctuationUsage(wordDropzone.punctuation, false);
        }

        wordDropzone.punctuation = selectedPunctuation;
        updatePunctuationUsage(selectedPunctuation, true);
      }

      // Capitalize the next word if the punctuation is a sentence-ending punctuation
      if (nextWordDropzone && [".", "?", "!"].includes(selectedPunctuation)) {
        nextWordDropzone.word =
          nextWordDropzone.word.charAt(0).toUpperCase() +
          nextWordDropzone.word.slice(1);
      }

      setAnswer([...answer]);
      setIsSomethingDragged(false);
    },
    [answer],
  );

  function resetAnswers() {
    setAnswer(makeTextPlain(text));
    setIsSomethingDragged(false);
    setPunctuationUsage(punctuationCountInit);
    setAnswerState("in-progress");
  }

  function submitAnswer() {
    const answerText = answer
      .map((word) => word.word + (word.punctuation ?? ""))
      .join(" ");

    setAnswerState(answerText === text ? "correct" : "incorrect");
  }

  return (
    <div className="grid gap-4">
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
          {answer.map((data, index) => (
            <Word
              key={index}
              data={data}
              wordIndex={index}
              isSomethingDragged={!!isSomethingDragged}
            />
          ))}
        </div>

        <div className="flex justify-between">
          <div className="grid w-fit grid-cols-4 gap-4">
            {Object.keys(punctuationUsage).map((symbol) => (
              <DraggableSymbol
                key={symbol}
                symbol={symbol}
                punctuationUsage={punctuationUsage}
              />
            ))}
          </div>
          <div className="flex items-center gap-6">
            <button
              className="w-fit rounded text-sm text-neutral-400 hover:text-slate-700"
              onClick={resetAnswers}
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
      </DndContext>

      {answerState === "correct" && (
        <p className="-mx-4 rounded bg-green-200 px-4 py-2 text-sm font-bold text-green-700">
          Correct! ✅
        </p>
      )}
      {answerState === "incorrect" && (
        <p className="-mx-4 rounded bg-red-200 px-4 py-2 text-sm font-bold text-red-700">
          Incorrect! ❌
        </p>
      )}
    </div>
  );
}
