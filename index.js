/**
 * Convert Transperth CSV to add columns for Tax
 */

const APP_NAME = "Transperth CSV Tool";

const INPUT_FILENAME =
  "./in/Transaction (ECU Card( 01-07-2024 to 25-05-2025)).csv";
const OUTPUT_DIR = "./out/";
const OUTPUT_PREFIX = "TransPerthExport_";

const TAG_ACTION = "Normal TAG OFF";

const OFF_TAG_LOCATIONS = ["Warwick", "Elizabeth Quay", "Perth"];

const WEEKDAY_STRINGS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// ---

const fs = require("fs");
const path = require("path");
const { parse } = require("fast-csv");
const { writeToPath } = require("@fast-csv/format");

let rows = [
  [
    "Date",
    "Time",
    "Action",
    "Location",
    "Service",
    "Bus Number",
    "Zone",
    "Amount",
    "Balance",
    "Notes",
    "Day Of Week",
    "Work Day",
  ],
];

// ---

async function main() {
  console.log(`${APP_NAME} started...`);

  let pathString = path.resolve(__dirname, INPUT_FILENAME);
  console.log("Loading File: ", pathString);

  if (fs.existsSync(pathString)) {
    console.log("File exists.");
  } else {
    console.log("File does not exist.");
  }

  fs.createReadStream(path.resolve(__dirname, INPUT_FILENAME))
    .pipe(parse({ headers: true }))
    // .pipe(csv())
    .on("error", (error) => console.error(error))
    .on("data", (row) => {
      //   console.log(row);
      row["WorkDay"] = "No";
      // console.log(row);

      var dateParts = row["Date"].split("-");
      var txDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

      let dayString = txDate.toDateString().substring(0, 3);
      row["Day Of Week"] = dayString;

      if (
        row["Action"] == TAG_ACTION &&
        OFF_TAG_LOCATIONS.includes(row["Location"])
      ) {
        if (WEEKDAY_STRINGS.includes(dayString)) {
          row["Work Day"] = "Yes";
        }
      }
      //each row can be written to db
      rows.push(row);
    })
    .on("end", (rowCount) => {
      console.log(`Parsed ${rowCount} rows, Work Days: ${rows.length}`);

      let fileName =
        OUTPUT_DIR + OUTPUT_PREFIX + new Date().toDateString() + ".csv";

      console.log(`Writing File: ${fileName}`);

      writeToPath(path.resolve(__dirname, fileName), rows)
        .on("error", (err) => console.error(err))
        .on("finish", () => console.log("Done writing."));
    })
    .on("open", () => console.log("File Opened"));
}

main()
  .then(() => {
    console.log(`${APP_NAME} completed successfully`);
  })
  .catch((err) => {
    console.log(`${APP_NAME} completed with errors`);
    console.error(err);
    process.exit(1);
  });
