
type UploadStatus = { chunks: number, totalChunks: number };
type TransactionStatus = { status: number, confirmations: number };
type TransactionId = string

export type ArweaveStatus = {
  tick?: number
  transactionStarted?: number,
  uploadStatus?: UploadStatus,
  transactionStatus?: TransactionStatus,
  transactionId?: TransactionId
  completed?: boolean
}
