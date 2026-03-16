import { execSync } from "node:child_process";

// DMG mounting/ejection uses macOS hdiutil and diskutil.
// For edge case reference: github.com/Homebrew/homebrew-cask/blob/main/Library/Homebrew/unpack_strategy/dmg.rb

function mountDmg(dmgPath: string, mountPoint: string): void {
  try {
    execSync(
      `hdiutil attach "${dmgPath}" -mountpoint "${mountPoint}" -nobrowse -readonly -noverify`,
      { input: "qn\n" },
    );
  } catch {
    // EULA present - convert to CDR and retry
    const cdrPath = `${dmgPath}.cdr`;
    execSync(
      `hdiutil convert "${dmgPath}" -format UDTO -o "${cdrPath}" 2>/dev/null`,
    );
    execSync(
      `hdiutil attach "${cdrPath}" -mountpoint "${mountPoint}" -nobrowse -readonly -noverify`,
    );
  }
}

function ejectDmg(mountPoint: string): void {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      execSync(`diskutil eject "${mountPoint}" 2>/dev/null`);
      return;
    } catch {
      if (attempt === 2) {
        execSync(
          `diskutil unmount force "${mountPoint}" 2>/dev/null || true`,
        );
      }
    }
  }
}

export { ejectDmg, mountDmg };
