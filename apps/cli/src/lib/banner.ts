// Braille art generated with drawille (npm) from favicon-transparent.png
// Text generated with figlet (npm) using the "Calvin S" font
import chalk from "chalk";

const ICON = [
  "     ⣀⣠⣤⣴⣶⣶⣶⣦⣤⣀     ",
  "  ⢀⣴⠟⠛⠛⠛⠿⣿⣿⣿⣿⣿⣿⣿⣦⡄  ",
  " ⣴⠋      ⠈⠻⣿⣿⣿⣿⣿⣿⣿⣦ ",
  "⣸⠇         ⢹⣿⣿⣿⣿⣿⣿⣿⣇",
  "⣿          ⠈⣿⣿⣿⣿⣿⣿⣿⣿",
  "⣿          ⢀⣿⣿⣿⣿⣿⣿⣿⡿",
  "⠸⡆         ⣸⣿⣿⣿⣿⣿⣿⣿⠇",
  " ⠹⣦⡀     ⢀⣴⣿⣿⣿⣿⣿⣿⡿⠋ ",
  "  ⠈⠻⢶⣤⣤⣤⣶⣿⣿⣿⣿⣿⣿⠿⠋   ",
  "     ⠈⠉⠛⠛⠛⠛⠛⠉⠉      ",
];

const TEXT = [
  "┌─┐┬  ┬ ┬┌─┐ ┌─┐┬ ┬┌┬┐┬┌─┐",
  "├─┘│  │ ││ ┬ ├─┤│ │ ││││ │",
  "┴  ┴─┘└─┘└─┘o┴ ┴└─┘─┴┘┴└─┘",
];

const PAD = "  ";

function printBanner(): void {
  const textStart = Math.floor((ICON.length - TEXT.length) / 2);
  const lines = ICON.map((iconLine, i) => {
    const textIdx = i - textStart;
    const textLine = TEXT[textIdx] ?? "";
    return `${PAD}${chalk.dim(iconLine)}   ${chalk.white(textLine)}`;
  });
  console.log();
  console.log(lines.join("\n"));
  console.log();
}

export { printBanner };
