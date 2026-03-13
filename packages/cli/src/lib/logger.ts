import chalk from "chalk";

function info(message: string): void {
  console.log(chalk.blue("i"), message);
}

function success(message: string): void {
  console.log(chalk.green("*"), message);
}

function warn(message: string): void {
  console.log(chalk.yellow("!"), message);
}

function error(message: string): void {
  console.error(chalk.red("x"), message);
}

function dim(message: string): void {
  console.log(chalk.dim(message));
}

function table(rows: string[][]): void {
  const widths = rows[0].map((_, i) =>
    Math.max(...rows.map((row) => (row[i] ?? "").length)),
  );
  for (const row of rows) {
    console.log(row.map((cell, i) => cell.padEnd(widths[i])).join("  "));
  }
}

export { dim, error, info, success, table, warn };
