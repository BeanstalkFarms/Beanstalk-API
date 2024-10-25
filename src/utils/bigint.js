const formatBigintHex = (_, value) => {
  if (typeof value === 'bigint') {
    const abs = BigInt_abs(value);
    return `${abs === value ? '' : '-'}0x${abs.toString(16)}`;
  } else {
    return value;
  }
};

const formatBigintDecimal = (_, value) => {
  return typeof value === 'bigint' ? value.toString(10) : value;
};

function BigInt_abs(x) {
  return x < 0 ? -x : x;
}

function BigInt_sum(a) {
  return a.reduce((r, c) => r + c, 0n);
}

function BigInt_max(a) {
  return a.reduce((r, c) => (c > r ? c : r), a[0]);
}

function BigInt_applyPercent(bi, percent) {
  const numerator = BigInt(Math.floor(percent * 100));
  const denominator = BigInt(100 * 100);
  return (bi * numerator) / denominator;
}

// Should wrap potentially falsy values in this
function isNil(value) {
  return value === undefined || value === null;
}

module.exports = {
  formatBigintHex,
  formatBigintDecimal,
  BigInt_abs,
  BigInt_sum,
  BigInt_max,
  BigInt_applyPercent,
  isNil
};
