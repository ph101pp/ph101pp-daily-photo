import { atom, selector } from "recoil";
import { TokenMetadataInputType } from "../_types/TokenMetadataInputType";
import tokenDataAtom from "./tokenDataAtom";
import tokenIdAtom from "./tokenIdAtom";
import formatDate from "../../utils/formatDate";




const tokenMetadataInputAtom = atom<TokenMetadataInputType | null>({
  key: "tokenMetadataInputAtom",
  default: selector<TokenMetadataInputType | null>({
    key: "existingTokenMetadataInputAtom",
    get: ({ get }) => {
      const existingTokenData = get(tokenDataAtom);
      const tokenId = get(tokenIdAtom);

      if (!tokenId) {
        return null;
      }

      const [tokenDate, tokenIndex] = tokenId.split("-");
      const formattedDate = formatDate(tokenDate);

      const defaultInput = {
        settings: "",
        camera: "",
        description: `This moment was captured on ${formattedDate}.`,
        project: "None",
        place: "",
        country: "",
        image_details: {
          size: 0,
          type: "string",
          width: 0,
          height: 0,
          sha256: ""
        }
      }

      if (!existingTokenData) {
        return defaultInput;
      }

      const existingMetadataInput: Partial<TokenMetadataInputType> = {
        settings: existingTokenData.attributes.find((attribute) => attribute.trait_type === "Settings")?.value as string | undefined,
        camera: existingTokenData.attributes.find((attribute) => attribute.trait_type === "Camera")?.value as string | undefined,
        description: existingTokenData.description as string | undefined,
        project: existingTokenData.attributes.find((attribute) => attribute.trait_type === "Project")?.value as string | undefined,
        place: existingTokenData.attributes.find((attribute) => attribute.trait_type === "Place")?.value as string | undefined,
        country: existingTokenData.attributes.find((attribute) => attribute.trait_type === "Country")?.value as string | undefined,
        image_details: existingTokenData.image_details
      }

      if (
        !existingMetadataInput.settings ||
        !existingMetadataInput.camera ||
        !existingMetadataInput.description ||
        !existingMetadataInput.project ||
        !existingMetadataInput.place ||
        !existingMetadataInput.country ||
        !existingMetadataInput.image_details
      ) {
        return defaultInput;
      }

      return existingMetadataInput as TokenMetadataInputType;
    }
  })
});

export default tokenMetadataInputAtom;