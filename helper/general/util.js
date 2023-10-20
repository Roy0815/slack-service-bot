//* ******************* Functions ********************//
function formatTime(date) {
  return `${date.getUTCHours() + 2 < 10 ? '0' : ''}${date.getUTCHours() + 2}:${
    date.getMinutes() < 10 ? '0' : ''
  }${date.getMinutes()}`;
}

function formatDate(date) {
  return `${date.getDate() < 10 ? '0' : ''}${date.getDate()}.${
    date.getMonth() + 1 < 10 ? '0' : ''
  }${date.getMonth() + 1}.${date.getFullYear()}`;
}

function convertNumberToColumn(number) {
  let column = '';
  while (number >= 0) {
    column = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[(number % 26) - 1] + column;
    number = Math.floor(number / 26) - 1;
  }
  return column;
}

// exports
module.exports = {
  formatTime,
  formatDate,
  convertNumberToColumn
};
