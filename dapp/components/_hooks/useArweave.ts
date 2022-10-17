import Arweave from "arweave";
import { useCallback } from "react";
import delay from "../_helpers/delay";
import { RecoilState, useSetRecoilState } from "recoil";
import { ArweaveStatus } from "../_types/ArweaveStatus";

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  logging: true
});

type TransactionId = string;
type Execute = ()=>Promise<string>;
type UploadToArweave = (data:ArrayBuffer|string, contentType: string) => Promise<[TransactionId, Execute]>

function useArweave(
  statusAtom: RecoilState<ArweaveStatus|null>, 
): UploadToArweave {
  const setStatus = useSetRecoilState(statusAtom);
  return useCallback<UploadToArweave>(async (data, contentType) => {
    const transaction = await arweave.createTransaction({ data });
    transaction.addTag('Content-Type', contentType);
    await arweave.transactions.sign(transaction);
    const transactionStarted = Date.now();

    setStatus({
      transactionStarted,
      transactionId: transaction.id
    });

    return [
      transaction.id,
      execute
    ];

    async function execute(): Promise<string> {
      let uploader = await arweave.transactions.getUploader(transaction);
      const uploadStarted = Date.now();
      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        setStatus({
          uploadStatus: {
            uploadStarted,
            chunks: uploader.uploadedChunks,
            totalChunks: uploader.totalChunks
          }
        });
        // console.log("uploadStatus", {
        //   chunks: uploader.uploadedChunks,
        //   totalChunks: uploader.totalChunks
        // })
      }
      let transactionStatus;
      do {
        await delay(1000);
        transactionStatus = await arweave.transactions.getStatus(transaction.id);
        setStatus({
          transactionStatus: {
            status: transactionStatus?.status,
            confirmations: transactionStatus?.confirmed?.number_of_confirmations ?? 0
          }
        });
        // console.log("transactionStatus", {
        //   status: transactionStatus?.status,
        //   confirmations: transactionStatus?.confirmed?.number_of_confirmations ?? 0
        // })
      } while (!transactionStatus?.confirmed || transactionStatus.confirmed.number_of_confirmations < 5);
  
      setStatus({
        completed: true
      });
  
      return transaction.id;
    }
  }, [arweave, setStatus]);
}

export default useArweave;