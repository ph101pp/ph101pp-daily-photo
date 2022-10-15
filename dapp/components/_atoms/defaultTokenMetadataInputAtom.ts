import { atom, selector } from "recoil";
import getTokenMetadata from "../../utils/getTokenMetadata";
import { TokenMetadataInputType } from "../_types/TokenMetadataInputType";
import imageAtom from "./imageAtom";
import tokenIdAtom from "./tokenIdAtom";
import tokenMetadataInputAtom from "./tokenMetadataAtom";

const shutterSpeeds = [1, 2, 4, 8, 15, 30, 60, 125, 250, 500, 1000, 2000, 4000];
const getShutterspeed = (exposureTime: number) => {
  let smallest = Infinity;
  let closestSpeed: number = 0;
  shutterSpeeds.forEach((speed) => {
    const diff = Math.abs((1 / speed) - exposureTime);
    if (diff < smallest) {
      smallest = diff;
      closestSpeed = speed;
    }
  });
  return closestSpeed;
}

const defaultTokenMetadataInputAtom = selector<TokenMetadataInputType | null>({
  key: "defaultTokenMetadataInputAtom",
  get: ({ get }) => {
    const image = get(imageAtom);
    const userMetadataInput = get(tokenMetadataInputAtom);

    if(userMetadataInput) {
      return userMetadataInput;
    }

    if (!image) {
      return null;
    }

    const autoCamera = `${image.exif.Make} ${image.exif.Model}`
    const exposureTime = parseFloat(image.exif.ExposureTime);
    const shutterSpeed = exposureTime >= 1 ? `${exposureTime}` : `1/${getShutterspeed(exposureTime)}`;
    const autoSettings = `${image.exif.FocalLength}mm ${shutterSpeed}s ƒ/${image.exif.FNumber} ISO${image.exif.ISOSpeedRatings}`;
    return {
      settings: autoSettings,
      camera: autoCamera,
      place: "",
      country: "",
      description: "",
    };
  },
  set: ({ set }, newValue)=>{
    set(tokenMetadataInputAtom, newValue);
  }

});

export default defaultTokenMetadataInputAtom;