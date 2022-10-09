import React, { Suspense } from "react";
import { useRecoilValue } from "recoil";
import tokenDataAtom from "./_atoms/tokenDataAtom"
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import NewUpload from "./NewUpload";

function App() {
  const tokenData = useRecoilValue(tokenDataAtom);
  return tokenData ? null : <NewUpload />;
}

export default () => (
  <Suspense 
    fallback={
      <Box sx={{display:"flex", justifyContent:"center"}}><CircularProgress /></Box>
    }
  >
    <App />
  </Suspense>
)