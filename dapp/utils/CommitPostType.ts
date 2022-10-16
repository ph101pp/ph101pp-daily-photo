import { object, string, Infer } from "superstruct";

export type CommitPostDataType = Infer<typeof CommitPostDataType>;
export const CommitPostDataType = object({
  message: string(),
  manifest: string(),
  manifest_uri: string(),
  tokenId: string(),
  tokenMetadata: string()
})