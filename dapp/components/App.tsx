import React, { Suspense } from "react";
import { useRecoilValue } from "recoil";
import tokenDataAtom from "./_atoms/tokenDataAtom"
import Container from "@mui/material/Container";
import NewToken from "./NewToken";

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ExistingToken from "./ExistingToken";
import Loading from "./Loading";
import getFutureMetadata from "../utils/getFutureMetadata";
import tokenIdAtom from "./_atoms/tokenIdAtom";
import { useSession } from "next-auth/react";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function App() {
  const tokenData = useRecoilValue(tokenDataAtom);
  const tokenId = useRecoilValue(tokenIdAtom);
  const { data: session, status } = useSession();

  if (!tokenId) {
    return null;
  }
  const [tokenDate, tokenIndex] = tokenId.split("-");
  const futureTokenData = getFutureMetadata(tokenDate, tokenIndex);


  if (!session) {
    return <ExistingToken tokenMetadata={tokenData ?? futureTokenData} />
  }

  return <NewToken tokenMetadata={tokenData ?? futureTokenData} />

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