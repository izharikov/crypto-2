var serpentConstants;
if (window) {
    serpentConstants = window.serpentConstants;
} else if (typeof module !== 'undefined' && module.exports) {
    serpentConstants = require('./serprent-constants');
}

var data = "abcdttyeopgh1234";
var key = "12345678901234567890123456789023";

var serpent = (function () {

    var PHI = 0x9e3779b9;

    function encode(data, key) {
        var b0 = splitBlock(data);
        b0 = replace(b0, serpentConstants.IPTable);
        var keys = generateKeys(key, serpentConstants.IPTable);
        var start = 0;
        for (var i = start; i < start + 31; i++) {
            s_encode(xor(b0, keys[i]), i, b0);
            b0 = l_encode(b0);
        }
        s_encode(xor(b0, keys[31]), 31, b0);
        b0 = xor(b0, keys[32]);
        b0 = replace(b0, serpentConstants.FPTable);
        return b0;
    }

    function decode(data, key) {
        var b0 = data;
        b0 = replace(b0, serpentConstants.IPTable);
        var keys = generateKeys(key, serpentConstants.IPTable);
        keys = keys.reverse();
        s_decode(xor(b0, keys[0]), 31, b0);
        b0 = xor(b0, keys[1]);
        for (var i = 2; i < 33; i++) {
            b0 = l_decode(b0);
            s_decode(b0, 32 - i, b0);
            b0 = xor(b0, keys[i])
        }
        b0 = replace(b0, serpentConstants.FPTable);
        return b0;
    }

    function process(data, key, ipTable, fpTable, l, s, encoder) {
        var b0 = encoder ? splitBlock(data) : data;
        b0 = replace(b0, serpentConstants.IPTable);
        var keys = generateKeys(key, serpentConstants.IPTable);
        var start = 0;
        if (!encoder) {
            keys = keys.reverse();
            start = 2;
            s(xor(b0, keys[0]), 31, b0);
            b0 = xor(b0, keys[1]);
            console.log('b0', b0);
        }
        for (var i = start; i < start + 31; i++) {
            if (encoder) {
                s(xor(b0, keys[i]), i, b0);
                b0 = l(b0);
            } else {
                b0 = l(b0);
                s(b0, 32 - i, b0);
                b0 = xor(b0, keys[i])
            }
            console.log('b0', b0);
        }
        if (encoder) {
            s(xor(b0, keys[31]), 31, b0);
            b0 = xor(b0, keys[32]);
        }
        b0 = replace(b0, serpentConstants.FPTable);
        console.log('---------- END PROCESS ------------')
        return b0;
    }

    function reverse(arr) {
        return arr.reverse();
    }

    function splitBlock(data) {
        var res = [0, 0, 0, 0];
        for (var i = 0; i < 4; i++) {
            res[i] = toByte(data.substr(i * 4, 4), 4);
        }
        return res;
    }

    function xor(arr1, arr2) {
        var result = [];
        for (var i = 0; i < arr1.length; i++) {
            result.push(arr1[i] ^ arr2[i])
        }
        return result;
    }

    function circLeftShift(bits, k) {
        return (bits << k) | (bits >>> (32 - k));
    }

    function generateKeys(key, table) {
        var w = [];
        for (var i = 0; i < 8; i++) {
            w.push(toByte(key.substr(i * 4, 4), 4))
        }
        for (i = 0; i < 131; i++) {
            w.push(circLeftShift((w[i - 8] ^ w[i - 5] ^ w[i - 3] ^ w[i - 1] ^ PHI ^ i), 11))
        }
        w.splice(0, 8);
        var k = [];
        for (i = 0; i < 133; i++) {
            k.push(0);
        }
        for (i = 0; i < 129; i += 4) {
            var whichS = (8 + 3 - Number.parseInt(i / 4) % 8) % 8;
            var usedS = serpentConstants.S_Table[whichS];
            for (var j = 0; j < 32; j++) {
                var idx = getBitsFromArrayByIndex(w.slice(i, i + 4), j);
                var r = usedS[idx];
                if (typeof r === 'undefined') {
                    console.log('und')
                }
                for (var h = 0; h < 4; h++) {
                    k[i + h] = k[i + h].setBitAt(r.bitAt(3 - h), j);
                }
            }
        }
        var K = [];
        for (i = 0; i < 33; i++) {
            K.push([k[4 * i], k[4 * i + 1], k[4 * i + 2], k[4 * i + 3]])
        }
        for (i = 0; i < 33; i++) {
            K[i] = replace(K[i], table);
        }
        return K;
    }


    function getBitsFromArrayByIndex(arr, index) {
        var res = [];
        for (var i = 0; i < arr.length; i++) {
            res.push(arr[i].bitAt(index))
        }
        return fromBitArray(res);
    }

    function toByte(str, lengthInBytes) {
        var res = 0;
        for (var i = 0; i < lengthInBytes; i++) {
            res = res << 8;
            res = res | str.charCodeAt(str.length - lengthInBytes + i);
        }
        return res;
    }

    function convertFrom128BitToString(byteArr) {
        var res = '';
        for (var i = 0; i < byteArr.length; i++) {
            var r = byteArr[i];
            for (var j = 0; j < 4; j++) {
                res += String.fromCharCode((r >> ((3 - j) * 8)) & 255);
            }
        }
        return res;
    }

    Number.prototype.bitAt = function (i) {
        return (this.valueOf() & (1 << i)) !== 0 ? 1 : 0;
    };

    Number.prototype.setBitAt = function (value, idx) {
        if (value === 1) {
            return this.valueOf() | (1 << idx);
        } else if (value === 0) {
            return this.valueOf() & ~(1 << idx);
        }
        return this.valueOf();
    };

    function fromBitArray(arr) {
        var result = 0;
        for (var i = 0; i < arr.length; i++) {
            result = (result << 1) | arr[i];
        }
        return result;
    }

    function l_encode(x) {
        return l(x, serpentConstants.LTTable)
    }

    function l_decode(x) {
        return l(x, serpentConstants.LTTableInverse)
    }

    function l(x, table) {
        var res = [0, 0, 0, 0];
        var bits = [];
        for (var i = 0; i < 128; i++) {
            var needBits = table[i];
            var bitValue = 0;
            for (var j = 0; j < needBits.length; j++) {
                var wrdId = Number.parseInt(needBits[j] / 32);
                var btIdx = 32 - (needBits[j] % 32);
                bitValue ^= x[wrdId].bitAt(btIdx);
            }
            bits.push(bitValue);
        }
        for (i = 0; i < 128; i++) {
            var wordIdx = Number.parseInt(i / 32);
            var bitIdx = 32 - (i % 32);
            res[wordIdx] = res[wordIdx].setBitAt(bits[i], bitIdx)
        }
        // console.log('l', res);
        return res;
    }

    function s_encode(input, indexOfS, out) {
        s(input, indexOfS, serpentConstants.S_Table, out, 0, 4);
    }

    function s_decode(input, indexOfS, out) {
        s(input, indexOfS, serpentConstants.S_Table_inverse, out, 0, 4);
    }

    //  таблица подстановок: {o1,o2,o3,o4} = s_i(w1,w2,w3,w4)
    function s(input, indexOfS, table, out, outIndexStart, outIndexEnd) {
        var res = [0, 0, 0, 0];
        var usedS = table[indexOfS % 8];
        for (var j = 0; j < 32; j++) {
            var idx = getBitsFromArrayByIndex(input, j); // idx = [0,15]
            var r = usedS[idx];
            for (var i = 0; i < 4; i++) {
                res[i] = res[i].setBitAt(r.bitAt(3 - i), j);
            }
        }
        for (var h = outIndexStart; h < outIndexEnd; h++) {
            out[h] = res[h - outIndexStart];
        }
    }

    function createStr(length) {

    }

    function replace(data, table) {
        var result = [0, 0, 0, 0];
        var bits = [];
        for (var i = 0; i < 128; i++) {
            var wordIdx = Number.parseInt(table[i] / 32);
            var bitIdx = 32 - table[i] % 32;
            bits[i] = data[wordIdx].bitAt(bitIdx);
        }
        for (i = 0; i < 128; i++) {
            var wordIdx = Number.parseInt(i / 32);
            var bitIdx = 32 - i % 32;
            result[wordIdx] = result[wordIdx].setBitAt(bits[i], bitIdx);
        }
        return result;
    }

    function fp(data) {
        return data;
    }

    return {
        encode: encode,
        decode: decode,
        test: function (data, key) {
            var testArr = [10, 223, 30, 4];
            console.log(replace(replace(testArr, serpentConstants.IPTable), serpentConstants.FPTable));
            var t = 2147483649;
            console.log(circLeftShift(2147483649, 1));
            var enc = encode(data, key);
            var dec = decode(enc, key);
            console.log('decoded:', splitBlock(data), dec);
            console.log(data, convertFrom128BitToString(dec))
        }
    }
})();

function bitRepresent(v) {
    var res = '';
    for (var i = 0; i < 32; i++) {
        res += v.bitAt(31 - i);
    }
    return res;
}

serpent.test(data, key);

if (window) {
    window.serpent = serpent;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = serpent;
}
