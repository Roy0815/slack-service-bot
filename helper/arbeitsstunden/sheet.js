const general = require('../general/util');
const sheet = require('../general/sheet');

const sheetAllgDaten = 'Allg Daten';
const idColumn = 1;
const firstNameColumn = 2;
const lastNameColumn = 3;
const leaveDateColumn = 5;
const slackIdColumn = 16;

const sheetStunden = 'Arbeitseinsätze';
const dateColumn = 1;
const nameColumn = 2;
const descriptionColumn = 3;
const hoursColumn = 4;

const sheetStundenSumme = 'Summe Stunden';
const workedHoursColumn = 3;
const targetHoursColumn = 4;
const yearColumn = 9;
const adminChannelColumn = 15;

//* ******************* Private functions ********************//
async function getUserFromSlackId (id) {
  const data = await sheet.getCells(sheetAllgDaten);
  return data.find((element) => element[slackIdColumn - 1] === id);
}

async function copySheetToNewYear (nameBase, year) {
  let currYear;
  if (year) {
    currYear = year;
  } else {
    currYear = new Date().getFullYear();
  }
  const oldYear = 2022;

  const copiedName = await sheet.copySheet(`${nameBase} ${oldYear}`);
  const newName = `${nameBase} ${currYear}`;

  await sheet.renameSheet(copiedName, newName);

  if (nameBase === sheetStundenSumme) {
    sheet.updateCell({
      range: `'${newName}'!${general.convertNumberToColumn(yearColumn)}1`,
      value: [[currYear]]
    });
    return;
  }

  if (nameBase === sheetStunden) {
    // clear function
    sheet.clearCell({
      range: `'${newName}'!$A2:D`
    });
  }
}

async function checkYearSheetsExists (year) {
  try {
    await sheet.getSheetID(getSheetNameYear(sheetStunden, year));
  } catch (err) {
    await copySheetToNewYear(sheetStunden, year);
  }
  try {
    await sheet.getSheetID(getSheetNameYear(sheetStundenSumme, year));
  } catch (err) {
    await copySheetToNewYear(sheetStundenSumme, year);
  }
}

function getSheetNameYear (name, year) {
  if (year) return `${name} ${year}`;
  return `${name} ${new Date().getFullYear()}`;
}

//* ******************* Public functions ********************//

async function getHoursFromSlackId ({ id, year, details }) {
  const user = await getUserFromSlackId(id);
  if (user === undefined) return undefined;

  if (year === undefined || year === '') year = new Date().getFullYear();

  await checkYearSheetsExists(year);

  const dataSum = await sheet.getCells(getSheetNameYear(sheetStundenSumme, year));

  const returnObj = {
    workedHours: dataSum[user[idColumn - 1]][workedHoursColumn - 1],
    targetHours: dataSum[user[idColumn - 1]][targetHoursColumn - 1].includes(
      '-'
    )
      ? 0
      : dataSum[user[idColumn - 1]][targetHoursColumn - 1],
    details: []
  };

  if (details) {
    const dataDetails = await sheet.getCells(
      getSheetNameYear(sheetStunden, year)
    );
    const userDetails = dataDetails.filter(
      (row) =>
        row[nameColumn - 1] ===
        `${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`
    );

    userDetails.forEach((element) => {
      returnObj.details.push({
        date: element[dateColumn - 1],
        name: element[nameColumn - 1],
        description: element[descriptionColumn - 1],
        hours: element[hoursColumn - 1]
      });
    });
  }

  return returnObj;
}

async function getAllUsers () {
  const array = await sheet.getCells(sheetAllgDaten);
  array.shift();
  const activeUsers = [];
  const today = new Date();

  for (const user of array) {
    // firstname and lastname empty: skip
    if (user[firstNameColumn - 1] === '' && user[lastNameColumn - 1] === '') { continue; }

    // if leave date empty: active
    if (user[leaveDateColumn - 1] === '') {
      activeUsers.push({
        id: user[idColumn - 1],
        name: `${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`
      });
      continue;
    }

    // get leave date
    const splitDate = user[leaveDateColumn - 1].split('.');
    const leaveDate = new Date(splitDate[2], splitDate[1] - 1, splitDate[0]);

    if (leaveDate > today) {
      activeUsers.push({
        id: user[idColumn - 1],
        name: `${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`
      });
    }
  }

  return activeUsers;
}

async function getAdminChannel () {
  await checkYearSheetsExists(new Date().getFullYear());
  return (await sheet.getCells(getSheetNameYear(sheetStundenSumme)))[0][
    adminChannelColumn - 1
  ];
}

async function saveSlackId ({ id, slackId }) {
  // find line with user
  const data = await sheet.getCells(sheetAllgDaten);
  const index = data.findIndex((element) => element[idColumn - 1] === id) + 1;

  sheet.updateCell({
    range: `'${sheetAllgDaten}'!${general.convertNumberToColumn(
      slackIdColumn
    )}${index}`,
    value: [[slackId]]
  });
}

async function saveHours ({ slackId, title, hours, date }) {
  const user = await getUserFromSlackId(slackId);
  await checkYearSheetsExists(date.split('-')[0]);

  await sheet.appendRow({
    range: `'${getSheetNameYear(sheetStunden, date.split('-')[0])}'!A:D`,
    values: [
      [date],
      [`${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`],
      [title],
      [hours]
    ]
  });
}

async function getNameFromSlackId ({ slackId }) {
  const user = await getUserFromSlackId(slackId);
  if (user === undefined) return undefined;

  return `${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`;
}

// exports
module.exports = {
  getAllUsers,
  getNameFromSlackId,
  getAdminChannel,
  getHoursFromSlackId,
  saveSlackId,
  saveHours
};
