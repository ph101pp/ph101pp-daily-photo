import { Accordion, AccordionSummary, Typography, AccordionDetails, Box, Button } from "@mui/material";
import { MetadataType } from "../utils/getBaseMetadata";

const ExistingToken = ({ tokenMetadata }: { tokenMetadata: MetadataType }) => {
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
          <Box
            component="img"
            sx={{
              width: "auto",
              maxHeight: "400px",
              maxWidth: "100%",
            }}
            src={tokenMetadata.image}
          />
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