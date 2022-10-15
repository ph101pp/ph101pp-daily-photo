import React, { useState } from "react";
import { useRecoilValue } from "recoil";
import useArweave from "./_hooks/useArweave";
import arweaveStatusAtom from "./_atoms/arweaveStatusAtom";
import imageAtom from "./_atoms/imageAtom";
import UploadImage from "./UploadImage";


// await octokit.repos.getContent({
//   owner: context.owner,
//   repo: context.repo,
//   path: change.path
// }).then(file=>{
//   sha = Array.isArray(file.data) || file.status !== 200 ? null: file.data.sha
// }).catch(()=>{});


export default function NewUpload() {
  const image = useRecoilValue(imageAtom);
  const uploadToArweave = useArweave(arweaveStatusAtom("uploadImage"));
  const status = useRecoilValue(arweaveStatusAtom("uploadImage"));

  return (
    <>
      <UploadImage />
      {image &&
        <button onClick={() => uploadToArweave(image.dataURL)}>Upload to Arweave</button>
      }
      {status?.transactionId &&
        <a href={`https://arweave.net/${status.transactionId}`}>{status.transactionId}</a>
      }
    </>
  )
}
