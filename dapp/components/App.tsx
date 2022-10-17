import React, { Suspense } from "react";
import { useRecoilValue } from "recoil";
import tokenDataAtom from "./_atoms/tokenDataAtom"
import Container from "@mui/material/Container";
import NewToken from "./NewToken";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ExistingToken from "./ExistingToken";
import Loading from "./Loading";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const tokenData = useRecoilValue(tokenDataAtom);
  return  tokenData ? 
    <ExistingToken tokenMetadata = { tokenData }  /> : 
    <NewToken />;
}

export default () => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <Container>
      <Suspense
        fallback={<Loading />}
      >
        <App />
      </Suspense>
    </Container>
  </ThemeProvider>
)