const { google } = require("googleapis");

const sheetAllgDaten = "Allg Daten";
const idColumn = 1;
const firstNameColumn = 2;
const lastNameColumn = 3;
const leaveDateColumn = 5;
const slackIdColumn = 15;

const sheetStundenSumme = "Summe Stunden 2022";
const workedHoursColumn = 3;
const targetHoursColumn = 4;
const adminChannelColumn = 15;

//******************** Private functions ********************//
async function getUserFromSlackId(id) {
  let data = await getCells(sheetAllgDaten);
  return data.find((element) => element[slackIdColumn - 1] == id);
}

function search(array, user_id) {
  for (var i = 1; i < array.length; i++) {
    if (array[i][0] == user_id) return array[i];
  }
}

// gets an array of all cells
async function getCells(sheet) {
  const auth = await google.auth.getClient({
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const request = {
    spreadsheetId: process.env.SHEET_ID,
    range: sheet,
  };

  return (await sheets.spreadsheets.values.get(request)).data.values;
}

//******************** Public functions ********************//
async function readCell(row, column) {
  console.log(await getCells(sheetAllgDaten));
  return (await getCells())[row][column];
}

async function getHoursFromSlackId(id) {
  let user = await getUserFromSlackId(id);
  if (user == undefined) return undefined;

  let data = await getCells(sheetStundenSumme);
  let userHours = data[user[0]];

  return {
    workedHours: userHours[workedHoursColumn - 1],
    targetHours: userHours[targetHoursColumn - 1].includes("-")
      ? 0
      : userHours[targetHoursColumn - 1],
  };
}

async function getAllUsers() {
  let array = await getCells(sheetAllgDaten);
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
  return (await getCells(sheetStundenSumme))[0][adminChannelColumn - 1];
}

async function register(name, user_id) {
  const array = await getCells(sheetAllgDaten);
  const row = search(array, user_id);
}

//exports
module.exports = {
  readCell,
  register,
  getAllUsers,
  getAdminChannel,
  getHoursFromSlackId,
};
