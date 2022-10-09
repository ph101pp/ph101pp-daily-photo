import { atomFamily, selectorFamily, DefaultValue } from "recoil";
import { ArweaveStatus } from "../_types/ArweaveStatus";

const arweaveStatusAtom = atomFamily<ArweaveStatus, string>({
  key: "arweaveStatusAtom",
  default:{}
})

const arweaveStatusSelector = selectorFamily<ArweaveStatus, string>({
  key: "arweaveStatusSelector",
  get: (key)=>({get})=>get(arweaveStatusAtom(key)),
  set: (key)=>({set, get}, value) => {
    if(!(value instanceof DefaultValue) ) {
      const current = get(arweaveStatusAtom(key));
      set(arweaveStatusAtom(key), {...current, ...value})
    }
  }
})

export default arweaveStatusSelector;



