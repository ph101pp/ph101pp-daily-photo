import { Alert, AlertTitle, Box, Button, LinearProgress, Typography } from "@mui/material";
import { useRecoilValue } from "recoil";
import arweaveStatusAtom from "./_atoms/arweaveStatusAtom";

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
      <Box>

        {status.uploadStatus && (
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: "100px" }}>
            <Box sx={{ minWidth: 120, padding: "8px 0px" }}>
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
              <Box sx={{ minWidth: 50 }}>
                <Typography variant="body2" color="text.secondary">{
                  `${status.uploadStatus.chunks} / ${status.uploadStatus.totalChunks}`
                }</Typography>
              </Box>
            </Box>
          </Box>
        )}
        {status.transactionStatus && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ minWidth: 120, padding: "8px 0px" }}>
              <Typography variant="body2" color="text.secondary">{
                "Confirmations:"
              }</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: "1" }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={status.transactionStatus.confirmations * 100 / Math.max(status.transactionStatus.confirmations, 5)}
                />
              </Box>
              <Box sx={{ minWidth: 50 }}>
                <Typography variant="body2" color="text.secondary">{
                  `${status.transactionStatus.confirmations} / ${Math.max(status.transactionStatus.confirmations, 5)}`
                }</Typography>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default ArweaveProgress;