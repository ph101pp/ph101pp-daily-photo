
type UploadStatus = { chunks: number, totalChunks: number };
type TransactionStatus = { status: number, confirmations: number };
type TransactionId = string

export type ArweaveStatus = {
  uploadStatus?: UploadStatus,
  transactionStatus?: TransactionStatus,
  transactionId?: TransactionId
}
