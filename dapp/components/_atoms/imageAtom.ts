import { atom } from "recoil";
import { ImageType } from "react-images-uploading";

const imageAtom = atom<{
  image: ImageType,
  dataURL: string,
  file: {
    type: string,
    size: number
  }
  exif: any
} | null >({
  key: "imageAtom",
  default: null
});

export default imageAtom;