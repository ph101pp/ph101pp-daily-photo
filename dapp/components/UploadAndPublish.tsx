import { Box } from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import SaveIcon from '@mui/icons-material/Save';
import DoneIcon from '@mui/icons-material/Done';
import { useRecoilState, useRecoilValue } from "recoil";
import bundlrStatusAtom from "./_atoms/bundlrStatusAtom";
import imageAtom from "./_atoms/imageAtom";
import tokenIdAtom from "./_atoms/tokenIdAtom";
import tokenMetadataInputAtom from "./_atoms/tokenMetadataAtom";
import manifestAtom from "./_atoms/manifestAtom";
import base64ToArrayBuffer from "./_helpers/base64ToArrayBuffer";
import getTokenMetadata from "../utils/getTokenMetadata";
import { CommitPostDataType } from "../utils/CommitPostType";
import bundlrUploadToArweave from "./_helpers/bundlrUploadToArweave";
import BundlrProgress from "./BundlrProgress";

if (!process.env.NEXT_PUBLIC_GOERLI_CONTRACT_ADDRESS) {
  throw new Error("Missing env variables.");
}

const contract = process.env.NEXT_PUBLIC_GOERLI_CONTRACT_ADDRESS;
const baseURI = "https://testnets-api.opensea.io";
// const baseURI = "https://api.opensea.io";
const getOSURL = (i: number) => `${baseURI}/api/v1/asset/${contract}/${i}?force_update=true`;

const numberOfSteps = 6;


const UploadAndPublish = () => {
  const tokenId = useRecoilValue(tokenIdAtom);
  const metadataInput = useRecoilValue(tokenMetadataInputAtom);
  const image = useRecoilValue(imageAtom);
  const manifest = useRecoilValue(manifestAtom);
  const [progress, setProgress] = useRecoilState(bundlrStatusAtom)

  const inProgress = progress.numberOfSteps > 0 && progress.numberOfSteps < progress.steps.length;
  const isDone = progress.numberOfSteps > 0 && progress.numberOfSteps === progress.steps.length;

  if (!tokenId || !metadataInput || !image || !manifest) {
    return null;
  }
  const [tokenDate, tokenIndex] = tokenId.split("-");

  const uploadData = async () => {
    setProgress({
      numberOfSteps,
      steps: [{
        message: "> Upload Image"
      }]
    });

    const data = new Uint8Array(base64ToArrayBuffer(image.dataURL));
    const [imageResult, imageStats] = await bundlrUploadToArweave(data, "image/jpeg");

    setProgress({
      numberOfSteps,
      steps: [
        {
          result: imageResult,
          stats: imageStats,
          message: "> Image Uploaded > Uploading Metadata."
        }
      ]
    });

    const tokenMetadata = getTokenMetadata({
      ...metadataInput,
      dateString: tokenDate,
      tokenIndex: tokenIndex,
      imageTx: imageResult.id
    });



    const [tokenResult, tokenStats] = await bundlrUploadToArweave(JSON.stringify(tokenMetadata), "application/json");


    setProgress({
      numberOfSteps,
      steps: [
        {
          result: tokenResult,
          stats: tokenStats,
          message: "> Metadata Uploaded > Uploading Manifest"
        }
      ]
    });

    const newManifest = {
      ...manifest,
      paths: {
        ...manifest.paths,
        [tokenId]: {
          id: tokenResult.id
        }
      }
    };


    const [manifestResult, manifestStats] = await bundlrUploadToArweave(JSON.stringify(newManifest), "application/x.arweave-manifest+json");

    setProgress({
      numberOfSteps,
      steps: [
        {
          result: tokenResult,
          stats: tokenStats,
          message: "> Manifest Uploaded > Committing Manifest to Github"
        }
      ]
    });

    const commitData: CommitPostDataType = {
      message: `Update Manifest: ${tokenMetadata.name}`,
      manifest: JSON.stringify(newManifest, null, 2),
      manifest_uri: `https://arweave.net/${manifestResult.id}/`,
      tokenId: tokenId,
      tokenMetadata: JSON.stringify(tokenMetadata, null, 2)
    }

    const commitResult = await fetch("/api/commit", {
      method: "POST",
      body: JSON.stringify(commitData)
    });


    setProgress({
      numberOfSteps,
      steps: [
        {
          result: commitResult,
          data: commitData,
          message: "> Manifest Committed > Refresh Opensea Metadata"
        }
      ]
    });

    const url = getOSURL(parseInt(tokenIndex));
    const osResult = await fetch(url);

    setProgress({
      numberOfSteps,
      steps: [
        {
          result: osResult,
          url,
          message: "> Opensea Metadata Refreshed > Done!"
        }
      ]
    });

  };

  return (<>
    <BundlrProgress/>

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