import React, {Suspense, useEffect} from "react";
import { useRouter } from 'next/router'
import App from "../components/App";
import {useSetRecoilState} from "recoil";
import tokenIdAtom from "../components/_atoms/tokenIdAtom";
import { isValidDate } from "../utils/isValidDate";

function Root() {
  const setTokenId = useSetRecoilState(tokenIdAtom);
  const route = useRouter();
  const tokenId = route.query.tokenId as string;

  useEffect(()=>{
    console.log("SET TOKENID", tokenId);
    if(isValidDate(tokenId)) {
      setTokenId(tokenId)
    }
  }, [tokenId, setTokenId])

  return <App/>;
}

export default React.memo(Root);