import React, {useEffect} from "react";
import { useRouter } from 'next/router'
import App from "../components/App";
import {useSetRecoilState} from "recoil";
import tokenIdAtom from "../components/_atoms/tokenIdAtom";
import { isValidDate } from "../utils/isValidDate";

function Root() {
  const setTokenId = useSetRecoilState(tokenIdAtom);
  const router = useRouter();

  const tokenId = router.query.tokenId as string;

  useEffect(()=>{
    console.log(tokenId);
    if(isValidDate(tokenId)) {
      setTokenId(tokenId)
    }
  }, [tokenId, setTokenId])

  if (!router.isReady) {
    return null;
  }

  return <App/>;
}

export default React.memo(Root);