import _getUpdateInitialHoldersRangeInput from "./_getUpdateInitialHoldersRangeInput";
import { ERC1155MintRangeTestContract } from "../typechain-types";

export default async function getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(
  c: ERC1155MintRangeTestContract,
  from: number,
  to: number,
  treasury: string,
  vault: string
): Promise<[
  string[],
  string[],
  number[][],
  number[][],
  string[][],
  number[],
  string
]> {
  return _getUpdateInitialHoldersRangeInput(c, from, to, [treasury, vault]);
}