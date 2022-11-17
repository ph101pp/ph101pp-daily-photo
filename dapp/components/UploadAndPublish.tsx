import { Box } from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import SaveIcon from '@mui/icons-material/Save';
import DoneIcon from '@mui/icons-material/Done';
import { useRecoilValue } from "recoil";
import arweaveStatusAtom from "./_atoms/arweaveStatusAtom";
import imageAtom from "./_atoms/imageAtom";
import tokenIdAtom from "./_atoms/tokenIdAtom";
import tokenMetadataInputAtom from "./_atoms/tokenMetadataAtom";
import manifestAtom from "./_atoms/manifestAtom";
import useArweave from "./_hooks/useArweave";
import base64ToArrayBuffer from "./_helpers/base64ToArrayBuffer";
import getTokenMetadata from "../utils/getTokenMetadata";
import { CommitPostDataType } from "../utils/CommitPostType";
import ArweaveProgress from "./ArweaveProgress";
import { useCallback, useState } from "react";
import arwalletAtom from "./_atoms/arwalletAtom";

const UploadAndPublish = () => {
  const tokenId = useRecoilValue(tokenIdAtom);
  const metadataInput = useRecoilValue(tokenMetadataInputAtom);
  const image = useRecoilValue(imageAtom);
  const manifest = useRecoilValue(manifestAtom);
  const arwallet = useRecoilValue(arwalletAtom);
  const uploadImage = useArweave(arweaveStatusAtom("uploadImage"), arwallet);
  const uploadMetadata = useArweave(arweaveStatusAtom("uploadMetadata"), arwallet);
  const uploadManifest = useArweave(arweaveStatusAtom("uploadManifest"), arwallet);
  const [inProgress, setInProgress] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!tokenId || !metadataInput || !image || !manifest) {
    return null;
  }

  const uploadData = async () => {
    setInProgress(true);
    const dataB64 = image.dataURL.replace("data:image/jpeg;base64,", "");
    const data = base64ToArrayBuffer(dataB64);
    const [imageTx, executeImageTx] = await uploadImage(data, "image/jpeg");
    const tokenMetadata = getTokenMetadata({
      ...metadataInput,
      dateString: tokenId,
      imageTx
    });
    const [tokenTx, executeTokenTx] = await uploadMetadata(JSON.stringify(tokenMetadata), "application/json");
    const newManifest = {
      ...manifest,
      // paths: {
      //   ...manifest.paths,
      //   [`${tokenId}.json`]: {
      //     id: tokenTx
      //   }
      // }
    };

    const [manifestTx, executeManifestTx] = await uploadManifest(JSON.stringify(newManifest), "application/x.arweave-manifest+json");

    console.log("optimistic", { imageTx, tokenTx, manifestTx });
    const finalManifestTx = await executeManifestTx()

    // const [finalImageTx, finalTokenTx, finalManifestTx] = await Promise.all([
    //   executeImageTx(),
    //   executeTokenTx(),
    //   executeManifestTx()
    // ]);
    return;
    console.log("final", {
      imageTx: finalImageTx,
      tokenTx: finalTokenTx,
      manifestTx: finalManifestTx
    });
    return;
    const commitData: CommitPostDataType = {
      message: `Update Manifest: ${tokenMetadata.name}`,
      manifest: JSON.stringify(newManifest, null, 2),
      manifest_uri: `https://arweave.net/${finalManifestTx}/`,
      tokenId: tokenId,
      tokenMetadata: JSON.stringify(tokenMetadata, null, 2)
    }

    await fetch("/api/commit", {
      method: "POST",
      body: JSON.stringify(commitData)
    });

    setIsDone(true);
    console.log("Done");
  };

  return (<>
    <ArweaveProgress statusAtomName="uploadImage" label="Image" />
    <ArweaveProgress statusAtomName="uploadMetadata" label="Metadata" />
    <ArweaveProgress statusAtomName="uploadManifest" label="Manifest" />

    <Box
      sx={{
        padding: "16px 0"
      }}
    >
      {!isDone && (
        <LoadingButton
          fullWidth={true}
          loading={inProgress}
          loadingPosition="start"
          startIcon={<SaveIcon />}
          variant="contained"
          onClick={() => confirm("Upload data to Arweave?") && uploadData()}
        >
          Upload & Publish
        </LoadingButton>
      )}
      {isDone && (
        <LoadingButton
          fullWidth={true}
          loading={false}
          loadingPosition="start"
          startIcon={<DoneIcon />}
          variant="contained"
          color="success"
        >
          Uploaded & Published
        </LoadingButton>
      )}
    </Box>
  </>
  )
}

export default UploadAndPublish;