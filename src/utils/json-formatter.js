const formatBigintHex = (_, value) => {
  if (typeof value === 'bigint') {
    const abs = absBigInt(value);
    return `${abs === value ? '' : '-'}0x${abs.toString(16)}`;
  } else {
    return value;
  }
};

const formatBigintDecimal = (_, value) => {
  return typeof value === 'bigint' ? value.toString(10) + 'n' : value;
};

function absBigInt(x) {
  return x < 0 ? -x : x;
}

module.exports = {
  formatBigintHex,
  formatBigintDecimal
};
