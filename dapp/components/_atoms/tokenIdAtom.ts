import { atom } from "recoil";


const tokenIdAtom = atom<string|null>({
  key: "tokenIdAtom",
  default: null
});

export default tokenIdAtom;