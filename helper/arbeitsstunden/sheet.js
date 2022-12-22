const { google } = require("googleapis");

const general = require("../general/util");
const sheet = require("../general/sheet");

const sheetAllgDaten = "Allg Daten";
const idColumn = 1;
const firstNameColumn = 2;
const lastNameColumn = 3;
const leaveDateColumn = 5;
const slackIdColumn = 15;

const sheetStunden = "Arbeitseinsätze";

const sheetStundenSumme = "Summe Stunden";
const workedHoursColumn = 3;
const targetHoursColumn = 4;
const yearColumn = 9;
const adminChannelColumn = 15;

//******************** Private functions ********************//
async function getUserFromSlackId(id) {
  let data = await sheet.getCells(sheetAllgDaten);
  return data.find((element) => element[slackIdColumn - 1] == id);
}

async function copySheetToNewYear(nameBase, year) {
  let currYear;
  if (year) {
    currYear = year;
  } else {
    currYear = new Date().getFullYear();
  }
  let oldYear = 2022;

  let copiedName = await sheet.copySheet(`${nameBase} ${oldYear}`);
  let newName = `${nameBase} ${currYear}`;

  await sheet.renameSheet(copiedName, newName);

  if (nameBase == sheetStundenSumme) {
    sheet.updateCell({
      range: `'${newName}'!${general.convertNumberToColumn(yearColumn)}1`,
      value: [[currYear]],
    });
    return;
  }

  if (nameBase == sheetStunden) {
    //clear function
    sheet.clearCell({
      range: `'${newName}'!$A2:D`,
    });
    return;
  }
}

async function checkYearSheetsExists(year) {
  try {
    await sheet.getSheetID(getSheetNameYear(sheetStundenSumme, year));
  } catch (err) {
    copySheetToNewYear(sheetStundenSumme, year);
  }
  try {
    await sheet.getSheetID(getSheetNameYear(sheetStunden, year));
  } catch (err) {
    copySheetToNewYear(sheetStunden, year);
  }
}

function getSheetNameYear(name, year) {
  if (year) return `${name} ${year}`;
  return `${name} ${new Date().getFullYear()}`;
}

//******************** Public functions ********************//

async function getHoursFromSlackId({ id, year }) {
  let user = await getUserFromSlackId(id);
  if (user == undefined) return undefined;

  if (year == "") year = new Date().getFullYear();

  await checkYearSheetsExists(year);

  let data = await sheet.getCells(getSheetNameYear(sheetStundenSumme, year));
  let userHours = data[user[0]];

  return {
    workedHours: userHours[workedHoursColumn - 1],
    targetHours: userHours[targetHoursColumn - 1].includes("-")
      ? 0
      : userHours[targetHoursColumn - 1],
  };
}

async function getAllUsers() {
  let array = await sheet.getCells(sheetAllgDaten);
  array.shift();
  let activeUsers = [];
  let today = new Date();

  for (let user of array) {
    // if leave date empty: active
    if (user[leaveDateColumn - 1] == "") {
      activeUsers.push({
        id: user[idColumn - 1],
        name: `${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`,
      });
      continue;
    }

    //get leave date
    let splitDate = user[leaveDateColumn - 1].split(".");
    let leaveDate = new Date(splitDate[2], splitDate[1] - 1, splitDate[0]);

    if (leaveDate > today)
      activeUsers.push({
        id: user[idColumn - 1],
        name: `${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`,
      });
  }

  return activeUsers;
}

async function getAdminChannel() {
  await checkYearSheetsExists(new Date().getFullYear());
  return (await sheet.getCells(getSheetNameYear(sheetStundenSumme)))[0][
    adminChannelColumn - 1
  ];
}

async function test(oldName, newName) {
  /*try {
    console.log(await getSheetID("test"));
  } catch (err) {
    console.log(err);
  }*/
  await checkYearSheetsExists(2023);
}

async function saveSlackId({ id, slackId }) {
  //find line with user
  let data = await sheet.getCells(sheetAllgDaten);
  let index = data.findIndex((element) => element[idColumn - 1] == id) + 1;

  sheet.updateCell({
    range: `'${sheetAllgDaten}'!${general.convertNumberToColumn(
      slackIdColumn
    )}${index}`,
    value: [[slackId]],
  });
}

async function saveHours({ slackId, title, hours, date }) {
  let user = await getUserFromSlackId(slackId);

  await checkYearSheetsExists(date.split("-")[0]);

  await sheet.appendRow({
    range: `'${getSheetNameYear(sheetStunden, date.split("-")[0])}'!A:D`,
    values: [
      [date],
      [`${user[firstNameColumn - 1]} ${user[lastNameColumn - 1]}`],
      [title],
      [hours],
    ],
  });
}

//exports
module.exports = {
  getAllUsers,
  getAdminChannel,
  getHoursFromSlackId,
  saveSlackId,
  saveHours,
  test,
};