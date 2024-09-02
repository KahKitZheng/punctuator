import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type WordProps = {
  data: Word;
  wordIndex: number;
  isSomethingDragged: boolean;
};

export const Word = (props: WordProps) => {
  const { data, wordIndex, isSomethingDragged } = props;

  const droppable = useDroppable({
    id: wordIndex.toString(),
  });
  const draggable = useDraggable({
    id: `${wordIndex}-${data.punctuation}`,
    data: {
      wordIndex: wordIndex,
      punctuation: data.punctuation,
    },
  });

  const inlineStyle = {
    borderBottom: isSomethingDragged
      ? "2px solid #fb923c"
      : "2px solid transparent",
    color: isSomethingDragged ? "#c2410c" : undefined,
    marginRight: data.punctuation ? "8px" : "",
    transform: data.punctuation
      ? CSS.Transform.toString(draggable.transform)
      : undefined,
  };

  return (
    <div className="flex">
      <p>{data?.word}</p>
      <p
        style={inlineStyle}
        ref={
          !data.punctuation || isSomethingDragged
            ? droppable.setNodeRef
            : draggable.setNodeRef
        }
        {...draggable.attributes}
        {...draggable.listeners}
      >
        {data.punctuation ? (
          <span className="grid h-fit w-4 place-content-center rounded border-b-orange-400 bg-orange-100 text-orange-700">
            {data.punctuation}
          </span>
        ) : (
          <span className="block w-2"></span>
        )}
      </p>
    </div>
  );
};
