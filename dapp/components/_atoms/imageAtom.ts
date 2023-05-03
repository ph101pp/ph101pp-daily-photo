import { atom, selector } from "recoil";
import { ImageType } from "react-images-uploading";
import tokenDataAtom from "./tokenDataAtom";

type ImageAtomType = {
  type: "new",
  image: ImageType,
  dataURL: string,
  file: {
    type: string,
    size: number
  }
  exif: any
} | {
  type: "existing"
  existingArHash: string,
} | null;


const imageAtom = atom<ImageAtomType>({
  key: "imageAtom",
  default: selector<ImageAtomType>({
    key: "defaultImageAtom",
    get: ({ get }) => {
      const existingTokenData = get(tokenDataAtom);

      if (!existingTokenData) {
        return null;
      }

      return {
        type: "existing",
        existingArHash: existingTokenData.image_url.replace("ar://", "")
      }
    }
  })
});

export default imageAtom;