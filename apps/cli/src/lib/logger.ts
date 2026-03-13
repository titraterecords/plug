import chalk from "chalk";

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

export { dim, error, success, warn };
