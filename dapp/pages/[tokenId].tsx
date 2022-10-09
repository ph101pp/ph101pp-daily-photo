import React, {Suspense, useEffect} from "react";
import { useRouter } from 'next/router'
import App from "../components/App";
import {useSetRecoilState} from "recoil";
import tokenIdAtom from "../components/_atoms/tokenIdAtom";

function isValidDate(tokenId?:string) {
  if(!tokenId) {
    return false;
  }
  const year = parseInt(tokenId.slice(0, 4));
  const month = parseInt(tokenId.slice(4, 6))-1;
  const day = parseInt(tokenId.slice(6, 8));

  const date = new Date(year, month, day);

  return !isNaN(date as any);
}

function Root() {
  const setTokenId = useSetRecoilState(tokenIdAtom);
  const route = useRouter();
  const tokenId = route.query.tokenId as string;

  useEffect(()=>{
    if(isValidDate(tokenId)) {
      setTokenId(tokenId)
    }
  }, [tokenId, setTokenId])

  return <App/>;
}

export default React.memo(Root);