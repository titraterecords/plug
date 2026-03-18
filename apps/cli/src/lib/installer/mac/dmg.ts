import { execSync } from "node:child_process";

// macOS DMG mounting via hdiutil.
// Some DMGs have license agreements that block non-interactive attach.
// Piping "qn\n" (quit + no) dismisses the EULA prompt. If that still
// fails, converting to CDR strips the agreement entirely.
// Reference: github.com/Homebrew/homebrew-cask/blob/main/Library/Homebrew/unpack_strategy/dmg.rb

function mountDmg(dmgPath: string, mountPoint: string): void {
  try {
    execSync(
      `hdiutil attach "${dmgPath}" -mountpoint "${mountPoint}" -nobrowse -readonly -noverify`,
      { input: "qn\n" },
    );
  } catch {
    const cdrPath = `${dmgPath}.cdr`;
    execSync(
      `hdiutil convert "${dmgPath}" -format UDTO -o "${cdrPath}" 2>/dev/null`,
    );
    execSync(
      `hdiutil attach "${cdrPath}" -mountpoint "${mountPoint}" -nobrowse -readonly -noverify`,
    );
  }
}

// Retries eject up to 3 times - the volume may be briefly busy if
// the OS is still indexing files from the mount.
function ejectDmg(mountPoint: string): void {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      execSync(`diskutil eject "${mountPoint}" 2>/dev/null`);
      return;
    } catch {
      if (attempt === 2) {
        execSync(`diskutil unmount force "${mountPoint}" 2>/dev/null || true`);
      }
    }
  }
}

export { ejectDmg, mountDmg };
