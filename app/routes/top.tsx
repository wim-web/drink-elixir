// top.tsx
import type { MetaArgs } from "react-router";
import { Form, redirect } from "react-router";
import type { Route } from "./+types/top";

export function meta({ }: MetaArgs) {
  return [
    { title: "Drink Elixir" },
  ];
}

export async function action({ context }: Route.ActionArgs) {
  const uuid = crypto.randomUUID()
  const db = context.hono.context.env.DB;
  await db.prepare("INSERT INTO session (session) VALUES (?)").bind(uuid).run();
  return redirect(`/game?session=${uuid}`);
}

export default function Top() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <h1 style={{ fontSize: "20px" }}>Drink Elixir</h1>
      <h3 style={{ fontSize: "16px" }}>version beta</h3>
      <Form method="post">
        <button
          type="submit"
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            fontSize: "16px",
            cursor: "pointer",
            border: "solid",
            borderRadius: "4px",
            color: "white",
          }}
        >
          Start
        </button>
      </Form>
    </div >
  );
}
