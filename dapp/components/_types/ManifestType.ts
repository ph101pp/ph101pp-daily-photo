import { literal, string, object, optional, record, Infer } from "superstruct";

export type ManifestType = Infer<typeof ManifestType>;
export const ManifestType = object({
  "manifest": literal("arweave/paths"),
  "version": literal("0.1.0"),
  "index": optional(
    object({
      "path": string()
    })
  ),
  "paths": record(
    string(),
    object({
      "id": string()
    })
  )
});