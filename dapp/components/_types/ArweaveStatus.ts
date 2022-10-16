
type UploadStatus = { uploadStarted: number, chunks: number, totalChunks: number };
type TransactionStatus = { status: number, confirmations: number };
type TransactionId = string

export type ArweaveStatus = {
  uploadStatus?: UploadStatus,
  transactionStarted?: number,
  transactionStatus?: TransactionStatus,
  transactionId?: TransactionId
  completed?: boolean
}
