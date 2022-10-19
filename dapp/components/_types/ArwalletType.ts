import { Infer, object, string } from "superstruct";

export type ArwalletType = Infer<typeof ArwalletType>;
export const ArwalletType = object({
  "kty": string(),
  "e": string(),
  "n": string(),
  "d": string(),
  "p": string(),
  "q": string(),
  "dp": string(),
  "dq": string(),
  "qi": string(),
});