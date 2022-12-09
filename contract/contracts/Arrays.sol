// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Arrays.sol)

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @dev Collection of functions related to array types.
 */
library Arrays {
    /**
     * @dev Searches a sorted `array` and returns the last index that contains
     * a value smaller or equal to `element`. This method will fail if no such index exists (i.e. all
     * values in the array are strictly more than `element`)
     * This is impossible within Ph101ppDailyPhoto. Time complexity O(log n).
     *
     * `array` is expected to be sorted in ascending order, and to contain no
     * repeated elements.
     */
    function findLowerBound(
        uint256[] memory array,
        uint256 element
    ) internal pure returns (uint256) {
        if (array.length == 0) {
            return 0;
        }

        uint256 low = 0;
        uint256 high = array.length;

        while (low < high) {
            uint256 mid = Math.average(low, high);

            // Note that mid will always be strictly less than high (i.e. it will be a valid array index)
            // because Math.average rounds down (it does integer division with truncation).
            if (array[mid] > element) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        
        // Change to use lower bound for Ph101ppDailyPhoto
        // This is safe because all ranges in Ph101ppDailyPhoto start with 0 and tokenId can't be negative. So low is never 0.
        return low - 1;

        // // At this point `low` is the exclusive upper bound. We will return the inclusive upper bound.
        // if (low > 0 && array[low - 1] == element) {
        //     return low - 1;
        // } else {
        //     return low;
        // }

    }
}
