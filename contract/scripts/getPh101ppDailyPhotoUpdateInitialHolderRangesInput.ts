import _getUpdateInitialHolderRangesInput from "./_getUpdateInitialHolderRangesInput";
import { ERC1155MintRangeUpdateable, Ph101ppDailyPhoto } from "../typechain-types";

export default async function getPh101ppDailyPhotoUpdateInitialHolderRangesInput(
  c: Ph101ppDailyPhoto,
  from: number,
  to: number,
  treasury: string,
  vault: string
): Promise<[
  ERC1155MintRangeUpdateable.UpdateInitialHolderRangesInputStruct,
  string
]> {
  return _getUpdateInitialHolderRangesInput(c, from, to, [treasury, vault]);
}