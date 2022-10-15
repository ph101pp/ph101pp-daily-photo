import React, { Suspense } from "react";
import { useRecoilValue } from "recoil";
import tokenDataAtom from "./_atoms/tokenDataAtom"
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import NewUpload from "./NewUpload";
import Header from "./Header";

function App() {
  const tokenData = useRecoilValue(tokenDataAtom);
  return <Container>
    <Header />
    {tokenData ? null : <NewUpload />}
  </Container>
}

export default () => (
  <Suspense
    fallback={
      <Box sx={{ display: "flex", justifyContent: "center" }}><CircularProgress /></Box>
    }
  >
    <App />
  </Suspense>
)