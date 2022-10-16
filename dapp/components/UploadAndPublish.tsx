import { Box, Button } from "@mui/material";
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

const MetadataPreview = () => {
  const tokenId = useRecoilValue(tokenIdAtom);
  const metadataInput = useRecoilValue(tokenMetadataInputAtom);
  const image = useRecoilValue(imageAtom);
  const manifest = useRecoilValue(manifestAtom);
  const uploadImage = useArweave(arweaveStatusAtom("uploadImage"));
  const uploadMetadata = useArweave(arweaveStatusAtom("uploadMetadata"));
  const uploadManifest = useArweave(arweaveStatusAtom("uploadManifest"));

  if (!tokenId || !metadataInput || !image || !manifest) {
    return null;
  }

  const uploadData = async () => {
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
      paths: {
        ...manifest.paths,
        [`${tokenId}.json`]: {
          id: tokenTx
        } 
      } 
    };

    const [manifestTx, executeManifestTx] = await uploadManifest(JSON.stringify(newManifest), "application/x.arweave-manifest+json");

    console.log("optimistic", { imageTx, tokenTx, manifestTx });

    const [finalImageTx, finalTokenTx, finalManifestTx] = await Promise.all([
      executeImageTx(),
      executeTokenTx(),
      executeManifestTx()
    ]);

    console.log("final", {
      imageTx: finalImageTx,
      tokenTx: finalTokenTx,
      manifestTx: finalManifestTx
    });

    const commitData: CommitPostDataType = {
      message: `Update Manifest: ${tokenMetadata.name}`,
      manifest: JSON.stringify(newManifest, null, 2),
      manifest_uri: `https://arweave.net/${finalManifestTx}/`,
      tokenId: tokenId,
      tokenMetadata: JSON.stringify(tokenMetadata, null, 2)
    }

    await fetch("/api/commit", {
      method:"POST", 
      body:JSON.stringify(commitData)
    });

    console.log("Done");
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
        onClick={() => confirm("Upload data to Arweave?") && uploadData()}
      >
        Upload & Publish
      </Button>
    </Box>
  )
}

export default MetadataPreview;