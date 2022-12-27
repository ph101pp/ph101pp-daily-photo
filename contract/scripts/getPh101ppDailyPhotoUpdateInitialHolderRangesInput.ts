import _getUpdateInitialHolderRangesInputSafe from "./_getUpdateInitialHolderRangesInput";
import { ERC1155MintRangeUpdateable, Ph101ppDailyPhoto } from "../typechain-types";

export default async function getPh101ppDailyPhotoUpdateInitialHolderRangesInput(
  c: Ph101ppDailyPhoto,
  treasury: string,
  vault: string
): Promise<[
  ERC1155MintRangeUpdateable.UpdateInitialHolderRangesInputStruct,
  string
]> {
  const newInitialHolders = [treasury, vault];
  const [currentInitialHolders, currentInitialHolderRanges] = await c.initialHolderRanges();
  return _getUpdateInitialHolderRangesInputSafe(
    c,
    currentInitialHolders.map(() => newInitialHolders),
    currentInitialHolderRanges.map((range) => range.toNumber())
  );
}