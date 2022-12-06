import { Accordion, AccordionSummary, Typography, AccordionDetails, Box, Button } from "@mui/material";
import { MetadataType } from "../utils/getBaseMetadata";
import Image from "next/image";
import arweaveUrl from "./_helpers/arweaveUrl";

const ExistingToken = ({ tokenMetadata }: { tokenMetadata: MetadataType }) => {
  const maxSize = 500;
  const ratio = tokenMetadata.image_details.height / tokenMetadata.image_details.width;
  const width = ratio < 1 ? maxSize : tokenMetadata.image_details.width * maxSize / tokenMetadata.image_details.height;
  const height = ratio > 1 ? maxSize : tokenMetadata.image_details.height * maxSize / tokenMetadata.image_details.width;
  return (<>
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography variant="h6">{tokenMetadata.name}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {tokenMetadata.image &&
            <Image
              alt="image"
              layout={"fixed"}
              src={arweaveUrl(tokenMetadata.image)}
              height={height}
              width={width}
            />
          }
        </Box>
      </AccordionDetails>
    </Accordion>
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography variant="h6">Metadata</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          component="pre"
        >
          <Typography>{JSON.stringify(tokenMetadata, null, 2)}</Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  </>)
}

export default ExistingToken;