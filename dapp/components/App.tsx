import React, { Suspense } from "react";
import { useRecoilValue } from "recoil";
import tokenDataAtom from "./_atoms/tokenDataAtom"
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import NewToken from "./NewToken";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ExistingToken from "./ExistingToken";
import NextAuthHeader from "./NextAuthHeader";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const tokenData = useRecoilValue(tokenDataAtom);
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container>
        <NextAuthHeader />
        {tokenData ? <ExistingToken tokenMetadata = {tokenData}  /> : <NewToken />}
      </Container>
    </ThemeProvider>
  )
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