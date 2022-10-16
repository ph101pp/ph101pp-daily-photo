import {Box, Button } from "@mui/material";
import { useRecoilValue } from "recoil";
import arweaveStatusAtom from "./_atoms/arweaveStatusAtom";
import imageAtom from "./_atoms/imageAtom";
import tokenIdAtom from "./_atoms/tokenIdAtom";
import tokenMetadataInputAtom from "./_atoms/tokenMetadataAtom";
import manifestAtom from "./_atoms/manifestAtom";
import useArweave from "./_hooks/useArweave";
import base64ToArrayBuffer from "./_helpers/base64ToArrayBuffer";
import getTokenMetadata from "../utils/getTokenMetadata";

const MetadataPreview = () => {
  const tokenId = useRecoilValue(tokenIdAtom);
  const metadataInput = useRecoilValue(tokenMetadataInputAtom);
  const image = useRecoilValue(imageAtom);
  const manifest = useRecoilValue(manifestAtom);
  const uploadImage = useArweave(arweaveStatusAtom("uploadImage"));
  const uploadMetadata = useArweave(arweaveStatusAtom("uploadMetadata"));
  const uploadManifest = useArweave(arweaveStatusAtom("uploadManifest"));

  if (!tokenId || !metadataInput || !image || !manifest ) {
    return null;
  }

  const uploadData = async ()=>{
    const dataB64 = image.dataURL.replace("data:image/jpeg;base64,", "");
    const data = base64ToArrayBuffer(dataB64);
    const imageTx = await uploadImage(data, "image/jpeg");
    const tokenMetadata = getTokenMetadata({
      ...metadataInput,
      dateString: tokenId,
      imageTx
    })
    const tokenTx = await uploadMetadata(data, "image/jpeg");

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
        onClick={()=>confirm("Upload data to Arweave?") && uploadData()}
        >
        Upload & Publish
      </Button>
    </Box>
  )
}

export default MetadataPreview;