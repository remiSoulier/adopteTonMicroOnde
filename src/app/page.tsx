import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const supabase = createClient(await cookies());
  const { data: todos, error } = await supabase.from("todos").select("id, name");

  if (error) {
    console.error("Unable to load todos:", error.message);
    return <main className="p-8"><p role="alert">Impossible de charger les tâches pour le moment.</p></main>;
  }

  return (
    <main className="p-8">
      <h1>TEST</h1>
      {todos.length === 0 ? (
        <p>Aucune tâche pour le moment.</p>
      ) : (
        <ul className="list-inside list-disc">
          {todos.map((todo) => <li key={todo.id}>{todo.name}</li>)}
        </ul>
      )}
    </main>
  );
}
