import { atomFamily, selectorFamily, DefaultValue } from "recoil";
import { ArweaveStatus } from "../_types/ArweaveStatus";

const arweaveStatusAtom = atomFamily<ArweaveStatus | null, string>({
  key: "arweaveStatusAtom",
  default: null
})

const arweaveStatusSelector = selectorFamily<ArweaveStatus | null, string>({
  key: "arweaveStatusSelector",
  get: (key) => ({ get }) => get(arweaveStatusAtom(key)),
  set: (key) => ({ set, get }, value) => {
    if (!(value instanceof DefaultValue)) {
      const current = get(arweaveStatusAtom(key));
      set(arweaveStatusAtom(key), { ...current, ...value, tick: (current?.tick ?? 0) + 1 })
    }
  }
})

export default arweaveStatusSelector;



