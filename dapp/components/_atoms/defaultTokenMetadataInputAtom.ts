import { selector } from "recoil";
import getBaseMetadata from "../../utils/getBaseMetadata";
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

function getImageDimensions(file:string): Promise<{width:number, height:number}> {
  return new Promise (function (resolved, rejected) {
    var i = new Image()
    i.onload = function(){
      resolved({width: i.width, height: i.height})
    };
    i.src = file
  })
}

async function sha256(text: string): Promise<string> {
  const textAsBuffer = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', textAsBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const defaultTokenMetadataInputAtom = selector<TokenMetadataInputType | null>({
  key: "defaultTokenMetadataInputAtom",
  get: async ({ get }) => {
    const image = get(imageAtom);
    const userMetadataInput = get(tokenMetadataInputAtom);
    const tokenId = get(tokenIdAtom);

    if(userMetadataInput) {
      return userMetadataInput;
    }

    if (!image || !tokenId) {
      return null;
    }
    const imageDimensions = await getImageDimensions(image.dataURL);
    const sha = await sha256(image.dataURL);
    const baseMetadata = getBaseMetadata(tokenId);
    const autoCamera = `${image.exif.Make} ${image.exif.Model}`
    const exposureTime = parseFloat(image.exif.ExposureTime);
    const shutterSpeed = exposureTime >= 1 ? `${exposureTime}` : `1/${getShutterspeed(exposureTime)}`;
    const autoSettings = `${image.exif.FocalLength}mm ${shutterSpeed}s ƒ/${image.exif.FNumber} ISO${image.exif.ISOSpeedRatings}`;
    return {
      settings: autoSettings,
      camera: autoCamera,
      description: `Photo taken ${baseMetadata.name}`,
      place: "",
      country: "",
      image_details: {
        size: image.file.size,
        type: image.file.type,
        width: imageDimensions.width,
        height: imageDimensions.height,
        sha256: sha
      }
    };
  },
  set: ({ set }, newValue)=>{
    set(tokenMetadataInputAtom, newValue);
  }

});

export default defaultTokenMetadataInputAtom;