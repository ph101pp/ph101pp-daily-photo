import Arweave from "arweave";
import { useCallback, useState } from "react";
import base64ToArrayBuffer from "../_helpers/base64ToArrayBuffer";
import delay from "../_helpers/delay";
import { RecoilState, useSetRecoilState } from "recoil";
import { ArweaveStatus } from "../_types/ArweaveStatus";

const arweave = Arweave.init({});

type UploadToArweave = (imageB64: string) => Promise<void>;

function useArweave(
  statusAtom: RecoilState<ArweaveStatus>, 
  onComplete: (transactionId: string)=>void = ()=>{}
): UploadToArweave {
  const setStatus = useSetRecoilState(statusAtom);
  return useCallback<UploadToArweave>(async (imageB64: string) => {
    const dataB64 = imageB64.replace("data:image/jpeg;base64,", "");
    const data = base64ToArrayBuffer(dataB64);
    const transaction = await arweave.createTransaction({ data });
    transaction.addTag('Content-Type', 'image/jpeg');
    await arweave.transactions.sign(transaction);

    setStatus({
      transactionId: transaction.id
    });

    let uploader = await arweave.transactions.getUploader(transaction);
    // console.log(transaction);
    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      setStatus({
        uploadStatus: {
          chunks: uploader.uploadedChunks,
          totalChunks: uploader.totalChunks
        }
      });
      // console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    }
    // console.log(uploader);
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
    } while (!transactionStatus?.confirmed || transactionStatus.confirmed.number_of_confirmations < 5);

    onComplete(transaction.id);
  }, [arweave, setStatus]);
}

export default useArweave;