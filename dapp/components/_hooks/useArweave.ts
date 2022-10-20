import Arweave from "arweave";
import { useCallback } from "react";
import delay from "../_helpers/delay";
import { RecoilState, useSetRecoilState } from "recoil";
import { ArweaveStatus } from "../_types/ArweaveStatus";
import { ArwalletType } from "../_types/ArwalletType";
import Transaction from "arweave/node/lib/transaction";
import { TransactionUploader } from "arweave/node/lib/transaction-uploader";

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
  logging: false
});

type TransactionId = string;
type Execute = ()=>Promise<string>;
type UploadToArweave = (data:ArrayBuffer|string, contentType: string) => Promise<[TransactionId, Execute]>

function useArweave(
  statusAtom: RecoilState<ArweaveStatus|null>, 
  key: ArwalletType | null
): UploadToArweave {
  const setStatus = useSetRecoilState(statusAtom);
  return useCallback<UploadToArweave>(async (data, contentType) => {
    const transaction: Transaction = await arweave.createTransaction({ data }, key ?? "use_wallet");
    transaction.addTag('Content-Type', contentType);
    transaction.addTag('author', "Ph101pp");
    transaction.addTag('project', "Daily Photo");
    transaction.addTag('website', "https://daily-photo.ph101pp.xyz");
    await arweave.transactions.sign(transaction, key ?? "use_wallet");
    const transactionStarted = Date.now();

    setStatus({
      transactionStarted,
      transactionId: transaction.id
    });

    return [
      transaction.id,
      execute
    ];

    async function waitForUpload() {
      let uploader = await arweave.transactions.getUploader(transaction);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        setStatus({
          uploadStatus: {
            chunks: uploader.uploadedChunks,
            totalChunks: uploader.totalChunks
          }
        });
        // console.log("uploadStatus", {
        //   chunks: uploader.uploadedChunks,
        //   totalChunks: uploader.totalChunks
        // })
      }
    }

    async function waitForTransaction(){
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
    }

    async function execute(): Promise<string> {
      
      await Promise.all([
        waitForUpload(),
        waitForTransaction()
      ]);
      
      setStatus({
        completed: true
      });
  
      return transaction.id;
    }
  }, [arweave, setStatus]);
}

export default useArweave;