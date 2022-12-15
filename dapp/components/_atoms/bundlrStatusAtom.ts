import { atom, DefaultValue, selector } from "recoil";
import { BundlrStatus } from "../_types/BundlrStatus";

const arweaveStatusAtom = atom<BundlrStatus>({
  key: "arweaveStatusAtom",
  default: {
    numberOfSteps: 0,
    steps: []
  }
})

const arweaveStatusSelector = selector<BundlrStatus>({
  key: "arweaveStatusSelector",
  get: ({ get }) => get(arweaveStatusAtom),
  set: ({ set, get }, value) => {
    const current = get(arweaveStatusAtom);
    if (!(value instanceof DefaultValue)) {
      set(arweaveStatusAtom, { ...current, ...value, steps: [...current.steps, ...value.steps] })
    }
  }
})

export default arweaveStatusSelector;



