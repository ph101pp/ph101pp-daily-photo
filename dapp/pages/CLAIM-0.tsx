import React, { Suspense, useEffect, useState } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Container from "@mui/material/Container";

import Box from "@mui/material/Box";
import LoadingButton from '@mui/lab/LoadingButton';
import getClaimMetadata from "../utils/getClaimMetadata";

import SaveIcon from '@mui/icons-material/Save';
import DoneIcon from '@mui/icons-material/Done';
import INITIAL_MANIFEST from "../../INITIAL_MANIFEST.json";
import { ManifestType } from "../components/_types/ManifestType";
import bundlrUploadToArweave from "../components/_helpers/bundlrUploadToArweave";
import BundlrProgress from "../components/BundlrProgress";
import bundlrStatusAtom from "../components/_atoms/bundlrStatusAtom";
import UploadImage from "../components/UploadImage";
import imageAtom from "../components/_atoms/imageAtom";
import base64ToArrayBuffer from "../components/_helpers/base64ToArrayBuffer";
import defaultTokenMetadataInputAtom from "../components/_atoms/defaultTokenMetadataInputAtom";
import tokenIdAtom from "../components/_atoms/tokenIdAtom";
import Loading from "../components/Loading";
import CLAIM from "../../TOKEN_METADATA/CLAIM-0.json";

const numberOfSteps = 4;
function Root() {
  const [progress, setProgress] = useRecoilState(bundlrStatusAtom)
  const inProgress = progress.numberOfSteps > 0 && progress.numberOfSteps < progress.steps.length;
  const isDone = progress.numberOfSteps > 0 && progress.numberOfSteps === progress.steps.length;
  const image = useRecoilValue(imageAtom);
  const input = useRecoilValue(defaultTokenMetadataInputAtom);

  const uploadData = async () => {
    const manifest = INITIAL_MANIFEST as ManifestType;

    setProgress({
      numberOfSteps,
      steps: [{
        message: "> Upload Image"
      }]
    });

    if (image?.type !== "new" || !input) {
      return;
    }

    const data = new Uint8Array(base64ToArrayBuffer(image.dataURL));
    const [imageResult, imageStats] = await bundlrUploadToArweave(data, "image/jpeg");

    setProgress({
      numberOfSteps,
      steps: [
        {
          result: imageResult,
          stats: imageStats,
          message: "> Image Uploaded > Upload Claim Metadata"
        }
      ]
    });


    // const claimMetadata = CLAIM;
    const claimMetadata = getClaimMetadata({
      image_details: input.image_details,
      imageTx: imageResult.id
    });

    const [claimResult, claimStats] = await bundlrUploadToArweave(JSON.stringify(claimMetadata), "application/json");

    setProgress({
      numberOfSteps,
      steps: [
        {
          result: claimResult,
          stats: claimStats,
          metadata: claimMetadata,
          message: "> Claim Uploaded > Uploading Manifest."
        }
      ]
    });

    const newManifest = {
      ...manifest,
      paths: {
        ...manifest.paths,
        [`CLAIM-0`]: {
          id: claimResult.id
        }
      }
    };

    const [manifestResult, manifestStats] = await bundlrUploadToArweave(JSON.stringify(newManifest), "application/x.arweave-manifest+json");

    setProgress({
      numberOfSteps,
      steps: [
        {
          result: manifestResult,
          stats: manifestStats,
          manifest: newManifest,
          message: "> Manifest Uploaded > Done"
        }
      ]
    });

  }

  return <Container>
    <UploadImage title={"Upload Claim"} />
    <BundlrProgress />

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
  </Container>;
}

export default () => {
  const [isClient, setIsClient] = useState(false);
  const setTokenId = useSetRecoilState(tokenIdAtom);

  useEffect(() => {
    setTokenId("CLAIM-0");
    setIsClient(true);
  })

  return isClient ? <Suspense
    fallback={<Loading />}
  ><Root /></Suspense> : null;
};