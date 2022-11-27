import { Accordion, AccordionSummary, Typography, AccordionDetails, Box, Button, CircularProgress } from "@mui/material";
import getBaseMetadata from "../utils/getBaseMetadata";
import tokenIdAtom from "./_atoms/tokenIdAtom";
import { useRecoilValue } from "recoil";

const Loading = () => {
  const tokenId = useRecoilValue(tokenIdAtom);
  let baseMetadata = null;

  if(tokenId) {
    const [tokenDate, tokenIndex] = tokenId.split("-");
    baseMetadata = getBaseMetadata(tokenDate, tokenIndex);
  }


  return (<>
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography variant="h6">{baseMetadata?.name ?? "Loading"}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <CircularProgress />
        </Box>
      </AccordionDetails>
    </Accordion>
  </>)
}

export default Loading;