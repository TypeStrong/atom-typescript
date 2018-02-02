import {execSync} from "child_process"
import {resolve} from "path"

// We can run in two modes here. If the argument given is write,
// we format all the files in the project. If it's check, we
// run prettier and if any file would change, return a non-zero exit code.
const action: string = process.argv[2]
switch (action) {
  case "write":
    execSync(command("write"), {stdio: "inherit"})
    break
  case "check":
    console.log("Checking for files that need formatting:")
    try {
      execSync(command("check"), {stdio: "inherit"})
      console.log("All good.")
    } catch (error) {
      if (error.status === 1) {
        console.log(
          "\nThe files listed above need to be formatted correctly. Please run the following command and commit the changes:\n> npm run prettier",
        )
      } else {
        console.error(error)
      }
      process.exit(1)
    }
    break
  default:
    console.log("usage: prettier write|check")
    process.exit(1)
}

function command(action: "write" | "check") {
  return [
    resolve(__dirname, "..", "node_modules", ".bin", "prettier"),
    ...[
      action === "write" ? "--write" : "--list-different",
      '"./{lib,scripts,spec}/**/*.{ts,tsx}"',
    ],
  ].join(" ")
}
