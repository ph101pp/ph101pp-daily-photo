import { UploadResponse } from "@bundlr-network/client/build/common/types";
import { BundlrStats } from "./BundlrStats";

type UploadStatus = { chunks: number, totalChunks: number };
type TransactionStatus = { status: number, confirmations: number };
type TransactionId = string

export type BundlrStatus = {
  numberOfSteps: number,
  steps: {
    message: string,
    [k: string]: any,
  }[]
}
