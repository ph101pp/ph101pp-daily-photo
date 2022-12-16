import React, { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
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


const numberOfSteps = 3;
function Root() {
  const [progress, setProgress] = useRecoilState(bundlrStatusAtom)
  const inProgress = progress.numberOfSteps > 0 && progress.numberOfSteps < progress.steps.length;
  const isDone = progress.numberOfSteps > 0 && progress.numberOfSteps === progress.steps.length;


  const uploadData = async ()=>{
    const manifest = INITIAL_MANIFEST as ManifestType;

    setProgress({
      numberOfSteps,
      steps: [{
        message: "> Upload Claim Metadata"
      }]
    });


    const claimMetadata = getClaimMetadata();

    const [claimResult, claimStats] = await bundlrUploadToArweave(JSON.stringify(claimMetadata), "application/json");

    setProgress({
      numberOfSteps,
      steps: [
        {
          result: claimResult,
          stats: claimStats,
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

  </Container>;
}

export default ()=>{
  const [isClient, setIsClient] = useState(false);
  useEffect(()=>{
    setIsClient(true);
  })

  return isClient?<Root />:null;
};