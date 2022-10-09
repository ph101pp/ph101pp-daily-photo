import { selector } from "recoil";
import tokenIdAtom from "./tokenIdAtom";

const arweaveURL = process.env.LATEST_MANIFEST_URI;

const existingTokenatom = selector<string>({
  key: "ExistingTokenAtom",
  get: async ({ get }) => {
    const tokenId = await get(tokenIdAtom);
    if(!tokenId) {
      return null;
    }
    return fetch(`${arweaveURL}${tokenId}.json`)
      .then(response => {
        if (response.status === 200) {
          return response.json()
        }
        else {
          return null;
        }
      });
  }
});

export default existingTokenatom;