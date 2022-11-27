import { Accordion, AccordionSummary, Typography, AccordionDetails, Box, Button } from "@mui/material";
import { useRecoilValue } from "recoil";
import getTokenMetadata from "../utils/getTokenMetadata";
import tokenIdAtom from "./_atoms/tokenIdAtom";
import tokenMetadataInputAtom from "./_atoms/tokenMetadataAtom";

const MetadataPreview = () => {
  const tokenId = useRecoilValue(tokenIdAtom);
  const metadataInput = useRecoilValue(tokenMetadataInputAtom);

  if (!tokenId || !metadataInput) {
    return null;
  }

  const [tokenDate, tokenIndex] = tokenId.split("-");

  const metadata = getTokenMetadata({
    ...metadataInput,
    dateString: tokenDate,
    imageTx: "TBD",
    tokenIndex
  });
  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography variant="h6">Metadata Preview</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          component="pre"
        >
          <Typography>{JSON.stringify(metadata, null, 2)}</Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

export default MetadataPreview;