import type { LoaderFunctionArgs, MetaArgs } from "react-router";

export function meta({ }: MetaArgs) {
  return [
    { title: "Drink Elixir" },
  ];
}

export function loader({ context }: LoaderFunctionArgs) {
  return { message: context.cloudflare.env.VALUE_FROM_CLOUDFLARE };
}

export default function Top() {
  return "welcome"
}
