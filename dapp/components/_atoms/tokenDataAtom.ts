import { selector } from "recoil";
import { MetadataType } from "../../utils/getBaseMetadata";
import arweaveUrl from "../_helpers/arweaveUrl";
import tokenIdAtom from "./tokenIdAtom";

const arweaveURL = arweaveUrl(process.env.LATEST_MANIFEST_URI!);

const existingTokenAtom = selector<MetadataType | null>({
  key: "tokenDataAtom",
  get: async ({ get }) => {
    const tokenId = await get(tokenIdAtom);
    if(!tokenId) {
      return null;
    }
    return fetch(`${arweaveURL}${tokenId}`)
      .then(response => {
        if (response.status === 200) {
          return response.json()
        }
        else {
          return null;
        }
      }).catch(()=>{
        return null;
      });
  }
});

export default existingTokenAtom;