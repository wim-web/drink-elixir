// top.tsx
import type { LoaderFunctionArgs, MetaArgs } from "react-router";
import { Link } from "react-router";

export function meta({ }: MetaArgs) {
  return [
    { title: "Drink Elixir" },
  ];
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
      <h1>Drink Elixir</h1>
      <Link to="/game" style={{ textDecoration: "none" }}>
        <button
          style={{
            fontSize: "24px",
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Start Game
        </button>
      </Link>
    </div>
  );
}
