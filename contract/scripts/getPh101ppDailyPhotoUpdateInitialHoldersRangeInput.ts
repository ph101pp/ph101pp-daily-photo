import _getUpdateInitialHoldersRangeInput from "./_getUpdateInitialHoldersRangeInput";
import { ERC1155MintRangeUpdateable, Ph101ppDailyPhoto } from "../typechain-types";

export default async function getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(
  c: Ph101ppDailyPhoto,
  from: number,
  to: number,
  treasury: string,
  vault: string
): Promise<[
  ERC1155MintRangeUpdateable.UpdateInitialHolderRangeInputStruct,
  string
]> {
  return _getUpdateInitialHoldersRangeInput(c, from, to, [treasury, vault]);
}