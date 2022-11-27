import { Alert, AlertTitle, Box, Button, CircularProgress, CircularProgressProps, LinearProgress, Typography } from "@mui/material";
import { useRecoilValue } from "recoil";
import arweaveStatusAtom from "./_atoms/arweaveStatusAtom";

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number },
) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          color="text.secondary"
        >{`${Math.round(props.value)}`}</Typography>
      </Box>
    </Box>
  );
}


const ArweaveProgress = ({ statusAtomName, label }: { statusAtomName: string, label: string }) => {
  const status = useRecoilValue(arweaveStatusAtom(statusAtomName));

  if (!status) {
    return null;
  }

  return (
    <Box
      sx={{
        padding: "8px 0px",
      }}>
      <Typography variant="h6" color="text.secondary">{label}</Typography>
      <Box
        sx={{
          display: "flex",
          flexGrow: 1
        }}
      >
        <Box sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1
        }}>
          {status.uploadStatus && (
            <Box sx={{ display: 'flex', alignItems: 'center', minWidth: "100px" }}>
              <Box sx={{ minWidth: "120px", padding: "8px 0px" }}>
                <Typography variant="body2" color="text.secondary">{
                  "Upload:"
                }</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: "1" }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={status.uploadStatus.chunks * 100 / status.uploadStatus.totalChunks}
                  />
                </Box>
                <Box sx={{ minWidth: "50px" }}>
                  <Typography variant="body2" color="text.secondary">{
                    `${status.uploadStatus.chunks} / ${status.uploadStatus.totalChunks}`
                  }</Typography>
                </Box>
              </Box>
            </Box>
          )}
          {status.transactionStatus && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ minWidth: "120px", padding: "8px 0px" }}>
                <Typography variant="body2" color="text.secondary">{
                  "Confirmations:"
                }</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: "1" }}>
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={status.transactionStatus.confirmations * 100 / Math.max(status.transactionStatus.confirmations, 3)}
                  />
                </Box>
                <Box sx={{ minWidth: "50px" }}>
                  <Typography variant="body2" color="text.secondary">{
                    `${status.transactionStatus.confirmations} / ${Math.max(status.transactionStatus.confirmations, 3)}`
                  }</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
        <Box sx={{
          display: "flex",
          width:"70px",
          justifyContent: "center",
          alignItems:"center"
        }}>
          {status.transactionStarted && 
            <CircularProgressWithLabel 
              size={50} 
              value={Math.floor((Date.now()-status.transactionStarted)/1000)} 
            />
          }
        </Box>
      </Box>
    </Box>
  )
}

export default ArweaveProgress;