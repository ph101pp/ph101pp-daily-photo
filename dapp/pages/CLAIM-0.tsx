import React, { useEffect, useState } from "react";
import { useRecoilValue } from "recoil";
import Container from "@mui/material/Container";
import ArweaveProgress from "../components/ArweaveProgress";
import Box from "@mui/material/Box";
import LoadingButton from '@mui/lab/LoadingButton';
import getClaimMetadata from "../utils/getClaimMetadata";
import arwalletAtom from "../components/_atoms/arwalletAtom";
import arweaveStatusAtom from "../components/_atoms/bundlrStatusAtom";
import useArweave from "../components/_hooks/useArweave";
import SaveIcon from '@mui/icons-material/Save';
import DoneIcon from '@mui/icons-material/Done';
import INITIAL_MANIFEST from "../../INITIAL_MANIFEST.json";
import { ManifestType } from "../components/_types/ManifestType";

function Root() {
  const arwallet = useRecoilValue(arwalletAtom);
  const uploadClaim = useArweave(arweaveStatusAtom("uploadClaim"), arwallet);
  const uploadManifest = useArweave(arweaveStatusAtom("uploadManifest"), arwallet);
  const [inProgress, setInProgress] = useState(false);
  const [isDone, setIsDone] = useState(false);


  const uploadData = async ()=>{
    const manifest = INITIAL_MANIFEST as ManifestType;

    setInProgress(true);
    const claimMetadata = getClaimMetadata();
    const [claimTx, executeClaimTx] = await uploadClaim(JSON.stringify(claimMetadata), "application/json");
    const newManifest = {
      ...manifest,
      paths: {
        ...manifest.paths,
        [`CLAIM-0`]: {
          id: claimTx
        }
      }
    };
    const [manifestTx, executeManifestTx] = await uploadManifest(JSON.stringify(newManifest), "application/x.arweave-manifest+json");

    
    console.log("optimistic", { claimTx, manifestTx });
    
    console.log(newManifest);

    const [finalTokenTx, finalManifestTx] = await Promise.all([
      executeClaimTx(),
      executeManifestTx()
    ]);

    console.log("final", {
      tokenTx: finalTokenTx,
      manifestTx: finalManifestTx
    });

    setInProgress(false);
    setIsDone(true);


  }

  return <Container>
    <ArweaveProgress statusAtomName="uploadClaim" label="Claim" />
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

  </Container>;
}

export default ()=>{
  const [isClient, setIsClient] = useState(false);
  useEffect(()=>{
    setIsClient(true);
  })

  return isClient?<Root />:null;
};