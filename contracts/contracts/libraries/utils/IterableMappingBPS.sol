// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

struct BasisPointsRange {
    uint16 bps; // basis points // perc fee 1% = 100bps
    uint96 flowRateLowerBound;
    uint96 flowRateUpperBound;
}

library IterableMappingBPS {
    // Iterable mapping from  uint256 (tag) to BasisPointsRange;
    struct Map {
        uint256[] keys;
        mapping(uint256 => BasisPointsRange) values;
        mapping(uint256 => uint256) indexOf;
        mapping(uint256 => bool) inserted;
    }

    function get(
        Map storage map,
        uint256 key
    ) internal view returns (BasisPointsRange memory) {
        return map.values[key];
    }

    function getKeyAtIndex(
        Map storage map,
        uint256 index
    ) internal view returns (uint256) {
        return map.keys[index];
    }

    function size(Map storage map) internal view returns (uint256) {
        return map.keys.length;
    }

    function set(
        Map storage map,
        uint256 key,
        uint16 _bps,
        uint96 _flowRateLowerBound,
        uint96 _flowRateUpperBound
    ) internal {
        if (map.inserted[key]) {
            map.values[key].bps = _bps;
            map.values[key].flowRateLowerBound = _flowRateLowerBound;
            map.values[key].flowRateUpperBound = _flowRateUpperBound;
        } else {
            map.inserted[key] = true;

            map.values[key].bps = _bps;
            map.values[key].flowRateLowerBound = _flowRateLowerBound;
            map.values[key].flowRateUpperBound = _flowRateUpperBound;

            map.indexOf[key] = map.keys.length;
            map.keys.push(key);
        }
    }

    function remove(Map storage map, uint256 key) internal {
        if (!map.inserted[key]) {
            return;
        }

        delete map.inserted[key];
        delete map.values[key];

        uint index = map.indexOf[key];
        uint lastIndex = map.keys.length - 1;
        uint256 lastKey = map.keys[lastIndex];

        map.indexOf[lastKey] = index;
        delete map.indexOf[key];

        map.keys[index] = lastKey;
        map.keys.pop();
    }
}
