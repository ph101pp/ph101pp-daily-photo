import { useRecoilValue } from "recoil";
import imageAtom from "./_atoms/imageAtom";
import Box from "@mui/material/Box";
import { Accordion, AccordionDetails, AccordionSummary, Button, Typography } from "@mui/material";


function ExifData() {
  const image = useRecoilValue(imageAtom);

  if (image?.type !== "new") {
    return null;
  }

  return (
    <Accordion>
      <AccordionSummary>
        <Typography variant="h6">Image Exif Data</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            display: "flex",
            flexGrow: "1"
          }}
          component="pre"
        >
          <Typography>{JSON.stringify(image.exif, null, 2)}</Typography>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

export default ExifData;