import { atom, selector } from "recoil";
import { TokenMetadataInputType } from "../_types/TokenMetadataInputType";

const tokenMetadataInputAtom = atom<TokenMetadataInputType | null>({
  key: "tokenMetadataInputAtom",
  default: null
});

export default tokenMetadataInputAtom;