import _getUpdateInitialHoldersInputSafe from "./_getUpdateInitialHoldersInput";
import { ERC1155MintRangeUpdateable, Ph101ppDailyPhoto } from "../typechain-types";

export default async function getPh101ppDailyPhotoUpdateInitialHoldersInput(
  c: Ph101ppDailyPhoto,
  treasury: string,
  vault: string
): Promise<[
  ERC1155MintRangeUpdateable.UpdateInitialHoldersInputStruct,
  string
]> {
  const newInitialHolders = [treasury, vault];
  const [currentInitialHolders, currentInitialHolderRanges] = await c.initialHolderRanges();
  return _getUpdateInitialHoldersInputSafe(
    c,
    currentInitialHolders.map(() => newInitialHolders),
    currentInitialHolderRanges.map((range) => range.toNumber())
  );
}