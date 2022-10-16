import Arweave from "arweave";
import { useCallback, useState } from "react";
import base64ToArrayBuffer from "../_helpers/base64ToArrayBuffer";
import delay from "../_helpers/delay";
import { RecoilState, useSetRecoilState } from "recoil";
import { ArweaveStatus } from "../_types/ArweaveStatus";

const arweave = Arweave.init({});

type UploadToArweave = (data:ArrayBuffer, contentType: string) => Promise<string>;

function useArweave(
  statusAtom: RecoilState<ArweaveStatus|null>, 
): UploadToArweave {
  const setStatus = useSetRecoilState(statusAtom);
  return useCallback<UploadToArweave>(async (data, contentType) => {
    const transaction = await arweave.createTransaction({ data });
    transaction.addTag('Content-Type', contentType);
    await arweave.transactions.sign(transaction);

    setStatus({
      transactionId: transaction.id
    });

    let uploader = await arweave.transactions.getUploader(transaction);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      setStatus({
        uploadStatus: {
          chunks: uploader.uploadedChunks,
          totalChunks: uploader.totalChunks
        }
      });
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
    } while (!transactionStatus?.confirmed || transactionStatus.confirmed.number_of_confirmations < 5);

    setStatus({
      completed: true
    });

    return transaction.id;
  }, [arweave, setStatus]);
}

export default useArweave;