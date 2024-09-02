import Assignment from "./components/Assignment";
import { data } from "./data";

function App() {
  return (
    <div className="m-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-8">
      <header className="flex items-center justify-between gap-4">
        <p className="text-3xl font-bold">Practice time 🧐</p>
      </header>
      <div className="grid gap-20">
        {data.slice(0, 1).map((text, index) => (
          <Assignment key={index} text={text} />
        ))}
      </div>
    </div>
  );
}

export default App;
