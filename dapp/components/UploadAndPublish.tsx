import {Box, Button } from "@mui/material";
import { useRecoilValue } from "recoil";
import getTokenMetadata from "../utils/getTokenMetadata";
import arweaveStatusAtom from "./_atoms/arweaveStatusAtom";
import imageAtom from "./_atoms/imageAtom";
import tokenIdAtom from "./_atoms/tokenIdAtom";
import tokenMetadataInputAtom from "./_atoms/tokenMetadataAtom";
import useArweave from "./_hooks/useArweave";

const MetadataPreview = () => {
  const tokenId = useRecoilValue(tokenIdAtom);
  const metadataInput = useRecoilValue(tokenMetadataInputAtom);
  const image = useRecoilValue(imageAtom);
  const uploadImage = useArweave(arweaveStatusAtom("uploadImage"));
  const uploadMetadata = useArweave(arweaveStatusAtom("uploadMetadata"));
  const uploadManifest = useArweave(arweaveStatusAtom("uploadManifest"));


  if (!tokenId || !metadataInput || !image ) {
    return null;
  }

  return (
    <Box
      sx={{
        margin: "16px 0"
      }}
    >
      <Button
        fullWidth={true}
        variant="contained"
        onClick={() => {
          console.log("do Magic");
        }}
      >
        Upload & Publish
      </Button>
    </Box>
  )
}

export default MetadataPreview;