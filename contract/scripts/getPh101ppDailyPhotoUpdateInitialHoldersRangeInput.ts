import _getUpdateInitialHoldersRangeInput from "./_getUpdateInitialHoldersRangeInput";
import { Ph101ppDailyPhoto } from "../typechain-types";

export default async function getPh101ppDailyPhotoUpdateInitialHoldersRangeInput(
  c: Ph101ppDailyPhoto,
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