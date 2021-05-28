//Started stripping https://gist.github.com/tupham81/a04d96cd48c8bcb8d4dc5301f3653937 to only support byte data, L error correction and only 0 mask.
//Sort of gave up midway through.
export default function QR() {
  var VERSIONS = [
    [[]],
    [[10, 7, 17, 13], [1, 1, 1, 1], []],
    [
      [16, 10, 28, 22],
      [1, 1, 1, 1],
      [4, 16],
    ],
    [
      [26, 15, 22, 18],
      [1, 1, 2, 2],
      [4, 20],
    ],
    [
      [18, 20, 16, 26],
      [2, 1, 4, 2],
      [4, 24],
    ],
    [
      [24, 26, 22, 18],
      [2, 1, 4, 4],
      [4, 28],
    ],
    [
      [16, 18, 28, 24],
      [4, 2, 4, 4],
      [4, 32],
    ],
    [
      [18, 20, 26, 18],
      [4, 2, 5, 6],
      [4, 20, 36],
    ],
    [
      [22, 24, 26, 22],
      [4, 2, 6, 6],
      [4, 22, 40],
    ],
    [
      [22, 30, 24, 20],
      [5, 2, 8, 8],
      [4, 24, 44],
    ],
    [
      [26, 18, 28, 24],
      [5, 4, 8, 8],
      [4, 26, 48],
    ],
    [
      [30, 20, 24, 28],
      [5, 4, 11, 8],
      [4, 28, 52],
    ],
    [
      [22, 24, 28, 26],
      [8, 4, 11, 10],
      [4, 30, 56],
    ],
    [
      [22, 26, 22, 24],
      [9, 4, 16, 12],
      [4, 32, 60],
    ],
    [
      [24, 30, 24, 20],
      [9, 4, 16, 16],
      [4, 24, 44, 64],
    ],
    [
      [24, 22, 24, 30],
      [10, 6, 18, 12],
      [4, 24, 46, 68],
    ],
    [
      [28, 24, 30, 24],
      [10, 6, 16, 17],
      [4, 24, 48, 72],
    ],
    [
      [28, 28, 28, 28],
      [11, 6, 19, 16],
      [4, 28, 52, 76],
    ],
    [
      [26, 30, 28, 28],
      [13, 6, 21, 18],
      [4, 28, 54, 80],
    ],
    [
      [26, 28, 26, 26],
      [14, 7, 25, 21],
      [4, 28, 56, 84],
    ],
    [
      [26, 28, 28, 30],
      [16, 8, 25, 20],
      [4, 32, 60, 88],
    ],
    [
      [26, 28, 30, 28],
      [17, 8, 25, 23],
      [4, 26, 48, 70, 92],
    ],
    [
      [28, 28, 24, 30],
      [17, 9, 34, 23],
      [4, 24, 48, 72, 96],
    ],
    [
      [28, 30, 30, 30],
      [18, 9, 30, 25],
      [4, 28, 52, 76, 100],
    ],
    [
      [28, 30, 30, 30],
      [20, 10, 32, 27],
      [4, 26, 52, 78, 104],
    ],
    [
      [28, 26, 30, 30],
      [21, 12, 35, 29],
      [4, 30, 56, 82, 108],
    ],
    [
      [28, 28, 30, 28],
      [23, 12, 37, 34],
      [4, 28, 56, 84, 112],
    ],
    [
      [28, 30, 30, 30],
      [25, 12, 40, 34],
      [4, 32, 60, 88, 116],
    ],
    [
      [28, 30, 30, 30],
      [26, 13, 42, 35],
      [4, 24, 48, 72, 96, 120],
    ],
    [
      [28, 30, 30, 30],
      [28, 14, 45, 38],
      [4, 28, 52, 76, 100, 124],
    ],
    [
      [28, 30, 30, 30],
      [29, 15, 48, 40],
      [4, 24, 50, 76, 102, 128],
    ],
    [
      [28, 30, 30, 30],
      [31, 16, 51, 43],
      [4, 28, 54, 80, 106, 132],
    ],
    [
      [28, 30, 30, 30],
      [33, 17, 54, 45],
      [4, 32, 58, 84, 110, 136],
    ],
    [
      [28, 30, 30, 30],
      [35, 18, 57, 48],
      [4, 28, 56, 84, 112, 140],
    ],
    [
      [28, 30, 30, 30],
      [37, 19, 60, 51],
      [4, 32, 60, 88, 116, 144],
    ],
    [
      [28, 30, 30, 30],
      [38, 19, 63, 53],
      [4, 28, 52, 76, 100, 124, 148],
    ],
    [
      [28, 30, 30, 30],
      [40, 20, 66, 56],
      [4, 22, 48, 74, 100, 126, 152],
    ],
    [
      [28, 30, 30, 30],
      [43, 21, 70, 59],
      [4, 26, 52, 78, 104, 130, 156],
    ],
    [
      [28, 30, 30, 30],
      [45, 22, 74, 62],
      [4, 30, 56, 82, 108, 134, 160],
    ],
    [
      [28, 30, 30, 30],
      [47, 24, 77, 65],
      [4, 24, 52, 80, 108, 136, 164],
    ],
    [
      [28, 30, 30, 30],
      [49, 25, 81, 68],
      [4, 28, 56, 84, 112, 140, 168],
    ],
  ];
  var MODE_TERMINATOR = 0;
  var MODE_OCTET = 4;
  var GF256_MAP: number[] = [],
    GF256_INVMAP = [-1];
  for (var i = 0, v = 1; i < 255; ++i) {
    GF256_MAP.push(v);
    GF256_INVMAP[v] = i;
    v = (v * 2) ^ (v >= 128 ? 0x11d : 0);
  }
  var GF256_GENPOLY: number[][] = [[]];
  for (var i = 0; i < 30; ++i) {
    var prevpoly = GF256_GENPOLY[i],
      poly: number[] = [];
    for (var j = 0; j <= i; ++j) {
      var a = j < i ? GF256_MAP[prevpoly[j]] : 0;
      var b = GF256_MAP[(i + (prevpoly[j - 1] || 0)) % 255];
      poly.push(GF256_INVMAP[a ^ b]);
    }
    GF256_GENPOLY.push(poly);
  }
  var ALPHANUMERIC_MAP: Record<string, number> = {};
  for (var i = 0; i < 45; ++i) {
    ALPHANUMERIC_MAP[
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:".charAt(i)
    ] = i;
  }
  var needsverinfo = function (ver: number) {
    return ver > 6;
  };
  var getsizebyver = function (ver: number) {
    return 4 * ver + 17;
  };
  var nfullbits = function (ver: number) {
    var v = VERSIONS[ver];
    var nbits = 16 * ver * ver + 128 * ver + 64;
    if (needsverinfo(ver)) {
      nbits -= 36;
    }
    if (v[2].length) {
      nbits -= 25 * v[2].length * v[2].length - 10 * v[2].length - 55;
    }
    return nbits;
  };
  var ndatabits = function (ver: number) {
    var nbits = nfullbits(ver) & ~7;
    var v = VERSIONS[ver];
    nbits -= 8 * v[0][1] * v[1][1];
    return nbits;
  };
  var ndatalenbits = (ver: number) => (ver < 10 ? 8 : 16);

  var getmaxdatalen = function (ver: number) {
    var nbits = ndatabits(ver) - 4 - ndatalenbits(ver);
    return (nbits / 8) | 0;
  };

  var encode = function (
    ver: number,
    mode: number,
    data: number[],
    maxbuflen: number
  ) {
    var buf = [];
    var bits = 0,
      remaining = 8;
    var datalen = data.length;
    var pack = function (x: number, n: number) {
      if (n >= remaining) {
        buf.push(bits | (x >> (n -= remaining)));
        while (n >= 8) {
          buf.push((x >> (n -= 8)) & 255);
        }
        bits = 0;
        remaining = 8;
      }
      if (n > 0) {
        bits |= (x & ((1 << n) - 1)) << (remaining -= n);
      }
    };
    var nlenbits = ndatalenbits(ver);
    pack(mode, 4);
    pack(datalen, nlenbits);
    for (var i = 0; i < datalen; ++i) {
      pack(data[i], 8);
    }
    pack(MODE_TERMINATOR, 4);
    if (remaining < 8) {
      buf.push(bits);
    }
    while (buf.length + 1 < maxbuflen) {
      buf.push(0xec, 0x11);
    }
    if (buf.length < maxbuflen) {
      buf.push(0xec);
    }
    return buf;
  };
  var calculateecc = function (poly: number[], genpoly: number[]) {
    var modulus = poly.slice(0);
    var polylen = poly.length,
      genpolylen = genpoly.length;
    for (var k = 0; k < genpolylen; ++k) {
      modulus.push(0);
    }
    for (var i = 0; i < polylen; ) {
      var quotient = GF256_INVMAP[modulus[i++]];
      if (quotient >= 0) {
        for (var j = 0; j < genpolylen; ++j) {
          modulus[i + j] ^= GF256_MAP[(quotient + genpoly[j]) % 255];
        }
      }
    }
    return modulus.slice(polylen);
  };
  var augumenteccs = function (
    poly: number[],
    nblocks: number,
    genpoly: number[]
  ) {
    var subsizes = [];
    var subsize = (poly.length / nblocks) | 0,
      subsize0 = 0;
    var pivot = nblocks - (poly.length % nblocks);
    for (var i = 0; i < pivot; ++i) {
      subsizes.push(subsize0);
      subsize0 += subsize;
    }
    for (var i = pivot; i < nblocks; ++i) {
      subsizes.push(subsize0);
      subsize0 += subsize + 1;
    }
    subsizes.push(subsize0);
    var eccs = [];
    for (var i = 0; i < nblocks; ++i) {
      eccs.push(
        calculateecc(poly.slice(subsizes[i], subsizes[i + 1]), genpoly)
      );
    }
    var result = [];
    var nitemsperblock = (poly.length / nblocks) | 0;
    for (var i = 0; i < nitemsperblock; ++i) {
      for (var j = 0; j < nblocks; ++j) {
        result.push(poly[subsizes[j] + i]);
      }
    }
    for (var j = pivot; j < nblocks; ++j) {
      result.push(poly[subsizes[j + 1] - 1]);
    }
    for (var i = 0; i < genpoly.length; ++i) {
      for (var j = 0; j < nblocks; ++j) {
        result.push(eccs[j][i]);
      }
    }
    return result;
  };
  var augumentbch = function (
    poly: number,
    p: number,
    genpoly: number,
    q: number
  ) {
    var modulus = poly << q;
    for (var i = p - 1; i >= 0; --i) {
      if ((modulus >> (q + i)) & 1) {
        modulus ^= genpoly << i;
      }
    }
    return (poly << q) | modulus;
  };
  var makebasematrix = function (ver: number) {
    var v = VERSIONS[ver],
      n = getsizebyver(ver);
    var matrix: number[][] = [],
      reserved: number[][] = [];
    for (var i = 0; i < n; ++i) {
      matrix.push([]);
      reserved.push([]);
    }
    var blit = function (
      y: number,
      x: number,
      h: number,
      w: number,
      bits: number[]
    ) {
      for (var i = 0; i < h; ++i) {
        for (var j = 0; j < w; ++j) {
          matrix[y + i][x + j] = (bits[i] >> j) & 1;
          reserved[y + i][x + j] = 1;
        }
      }
    };
    blit(0, 0, 9, 9, [0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x17f, 0x00, 0x40]);
    blit(n - 8, 0, 8, 9, [0x100, 0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x7f]);
    blit(
      0,
      n - 8,
      9,
      8,
      [0xfe, 0x82, 0xba, 0xba, 0xba, 0x82, 0xfe, 0x00, 0x00]
    );
    for (var i = 9; i < n - 8; ++i) {
      matrix[6][i] = matrix[i][6] = ~i & 1;
      reserved[6][i] = reserved[i][6] = 1;
    }
    var aligns = v[2],
      m = aligns.length;
    for (var i = 0; i < m; ++i) {
      var minj = i === 0 || i === m - 1 ? 1 : 0,
        maxj = i === 0 ? m - 1 : m;
      for (var j = minj; j < maxj; ++j) {
        blit(aligns[i], aligns[j], 5, 5, [0x1f, 0x11, 0x15, 0x11, 0x1f]);
      }
    }
    if (needsverinfo(ver)) {
      var code = augumentbch(ver, 6, 0x1f25, 12);
      var k = 0;
      for (var i = 0; i < 6; ++i) {
        for (var j = 0; j < 3; ++j) {
          matrix[i][n - 11 + j] = matrix[n - 11 + j][i] = (code >> k++) & 1;
          reserved[i][n - 11 + j] = reserved[n - 11 + j][i] = 1;
        }
      }
    }
    return {
      matrix: matrix,
      reserved: reserved,
    };
  };
  var putdata = function (
    matrix: number[][],
    reserved: number[][],
    buf: number[]
  ) {
    var n = matrix.length;
    var k = 0,
      dir = -1;
    for (var i = n - 1; i >= 0; i -= 2) {
      if (i === 6) {
        --i;
      }
      var jj = dir < 0 ? n - 1 : 0;
      for (var j = 0; j < n; ++j) {
        for (var ii = i; ii > i - 2; --ii) {
          if (!reserved[jj][ii]) {
            matrix[jj][ii] = (buf[k >> 3] >> (~k & 7)) & 1;
            ++k;
          }
        }
        jj += dir;
      }
      dir = -dir;
    }
    return matrix;
  };
  var maskdata = function (matrix: number[][], reserved: number[][]) {
    var maskf = (i: number, j: number) => (i + j) % 2 === 0;
    var n = matrix.length;
    for (var i = 0; i < n; ++i) {
      for (var j = 0; j < n; ++j) {
        if (!reserved[i][j]) {
          //@ts-ignore
          matrix[i][j] ^= maskf(i, j);
        }
      }
    }
    return matrix;
  };
  var putformatinfo = function (matrix: number[][], ecclevel: number) {
    var n = matrix.length;
    var code = augumentbch((ecclevel << 3) | 0, 5, 0x537, 10) ^ 0x5412;
    for (var i = 0; i < 15; ++i) {
      var r = [
        0,
        1,
        2,
        3,
        4,
        5,
        7,
        8,
        n - 7,
        n - 6,
        n - 5,
        n - 4,
        n - 3,
        n - 2,
        n - 1,
      ][i];
      var c = [
        n - 1,
        n - 2,
        n - 3,
        n - 4,
        n - 5,
        n - 6,
        n - 7,
        n - 8,
        7,
        5,
        4,
        3,
        2,
        1,
        0,
      ][i];
      matrix[r][8] = matrix[8][c] = (code >> i) & 1;
    }
    return matrix;
  };
  var generate = function (data: number[], ver: number) {
    var v = VERSIONS[ver];
    var buf = encode(ver, MODE_OCTET, data, ndatabits(ver) >> 3);
    buf = augumenteccs(buf, v[1][1], GF256_GENPOLY[v[0][1]]);
    var result = makebasematrix(ver);
    var matrix = result.matrix,
      reserved = result.reserved;
    putdata(matrix, reserved, buf);
    maskdata(matrix, reserved);
    putformatinfo(matrix, 1);
    return matrix;
  };
  var QRCode = {
    generate: function (source: string) {
      const data = new TextEncoder().encode(source);
      let ver = 1;
      for (ver = 1; ver <= 40; ++ver) {
        if (data.length <= getmaxdatalen(ver)) {
          break;
        }
      }
      //@ts-ignore UINtarray is fine
      return generate(data, ver);
    },
    writeToCanvas: function (
      source: string,
      canvas: HTMLCanvasElement,
      {
        fillColor = "#FFFFFF",
        textColor = "#000000",
        margin = 1.5,
        modSize = 10,
      } = {}
    ) {
      var matrix = QRCode["generate"](source);
      var n = matrix.length;
      var size = modSize * (n + 2 * margin);
      canvas.width = canvas.height = size;
      const context = canvas.getContext("2d");
      if (context == null) {
        throw new Error("Could not get context from canvas");
      }
      context.fillStyle = fillColor;
      context.fillRect(0, 0, size, size);
      context.fillStyle = textColor;
      context.imageSmoothingEnabled = false;
      for (var i = 0; i < n; ++i) {
        for (var j = 0; j < n; ++j) {
          if (matrix[i][j]) {
            context.fillRect(
              modSize * (margin + j),
              modSize * (margin + i),
              modSize,
              modSize
            );
          }
        }
      }
    },
  };
  return QRCode;
}
