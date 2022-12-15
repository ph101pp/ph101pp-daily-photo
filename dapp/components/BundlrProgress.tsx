import { Accordion, AccordionDetails, AccordionSummary, Alert, AlertTitle, Box, Button, CircularProgress, CircularProgressProps, LinearProgress, Typography } from "@mui/material";
import { flexbox } from "@mui/system";
import { useRecoilValue } from "recoil";
import BundlrStatusAtom from "./_atoms/bundlrStatusAtom";
import arweaveStatusAtom from "./_atoms/bundlrStatusAtom";



const ArweaveProgress = () => {
  const status = useRecoilValue(BundlrStatusAtom);

  if (status.numberOfSteps === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        padding: "8px 0px",
      }}>
      <Typography variant="h6" color="text.secondary">{"Uploading Image"}</Typography>
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          flexDirection: "column"
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: "100px" }}>
          <Box sx={{ minWidth: "120px", padding: "8px 0px" }}>
            <Typography variant="body2" color="text.secondary">{
              "Progress:"
            }</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: "1" }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={status.steps.length * 100 / status.numberOfSteps}
              />
            </Box>
          </Box>
          <Box sx={{ minWidth: "50px", textAlign: "right" }}>
            <Typography variant="body2" color="text.secondary">{
              `${status.steps.length} / ${status.numberOfSteps}`
            }</Typography>
          </Box>
        </Box>

        <Box>
          {status.steps.map(({ message, ...stats }, i, steps) => (
            <Accordion>
              <AccordionSummary>
                <Box style={{ display: "flex", flex:"1", justifyContent:"space-between" }}>
                  <Box>
                    <Typography variant="caption">{message}</Typography>
                  </Box>
                  <Box>
                    {i !== status.numberOfSteps - 1 && i === steps.length - 1 && <CircularProgress variant="indeterminate" size={20} />}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography component="pre" variant="caption">{JSON.stringify(stats, null, 2)}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default ArweaveProgress;