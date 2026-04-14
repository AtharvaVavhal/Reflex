import { ContextInput, RawContext } from "./types";

export function contextCollector(input: ContextInput): RawContext {
  return {
    ...input,
    pageViews: 5,
  };
}