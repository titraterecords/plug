#!/bin/sh
# Install or update plug - audio plugin manager for macOS and Linux.
# Usage: curl -fsSL plug.audio/install.sh | sh
#
# What this script does:
# 1. Checks if plug was previously installed via npm - if so, updates via npm
# 2. Otherwise, detects your OS and architecture (macOS/Linux, arm64/x64)
# 3. Downloads the matching standalone binary from the latest GitHub release
# 4. Installs to ~/.plug/bin/ and adds it to your PATH
#
# No Node.js or other dependencies required for the binary install.
# Windows users: npm install -g @titrate/plug

set -e

REPO="titraterecords/plug"
INSTALL_DIR="${HOME}/.plug/bin"

# Maps uname output to GitHub release artifact names
detect_platform() {
  os=$(uname -s)
  arch=$(uname -m)

  case "$os" in
    Darwin)
      case "$arch" in
        arm64) echo "darwin-arm64" ;;
        x86_64) echo "darwin-x64" ;;
        *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
      esac
      ;;
    Linux)
      case "$arch" in
        x86_64) echo "linux-x64" ;;
        aarch64) echo "linux-arm64" ;;
        *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
      esac
      ;;
    *)
      echo "Unsupported OS: $os" >&2
      echo "Windows users: npm install -g @titrate/plug" >&2
      exit 1
      ;;
  esac
}

# Appends ~/.plug/bin to PATH in the user's shell profile if not already present
add_to_path() {
  case "$SHELL" in
    */zsh) profile="$HOME/.zshrc" ;;
    */bash) profile="$HOME/.bashrc" ;;
    *) profile="$HOME/.profile" ;;
  esac

  if ! echo "$PATH" | tr ':' '\n' | grep -qx "$INSTALL_DIR"; then
    echo "" >> "$profile"
    echo "export PATH=\"${INSTALL_DIR}:\$PATH\"" >> "$profile"
    echo "Added ${INSTALL_DIR} to PATH in ${profile}"
    echo "Run: source ${profile} (or open a new terminal)"
  fi
}

# Braille art generated with drawille (npm) from favicon-transparent.png
# Text generated with figlet (npm) using the "Calvin S" font
banner() {
  cat <<'BANNER'

       ⣀⣠⣤⣴⣶⣶⣶⣦⣤⣀
    ⢀⣴⠟⠛⠛⠛⠿⣿⣿⣿⣿⣿⣿⣿⣦⡄
   ⣴⠋      ⠈⠻⣿⣿⣿⣿⣿⣿⣿⣦
  ⣸⠇         ⢹⣿⣿⣿⣿⣿⣿⣿⣇
  ⣿          ⠈⣿⣿⣿⣿⣿⣿⣿⣿   ┌─┐┬  ┬ ┬┌─┐ ┌─┐┬ ┬┌┬┐┬┌─┐
  ⣿          ⢀⣿⣿⣿⣿⣿⣿⣿⡿   ├─┘│  │ ││ ┬ ├─┤│ │ ││││ │
  ⠸⡆         ⣸⣿⣿⣿⣿⣿⣿⣿⠇   ┴  ┴─┘└─┘└─┘o┴ ┴└─┘─┴┘┴└─┘
   ⠹⣦⡀     ⢀⣴⣿⣿⣿⣿⣿⣿⡿⠋
    ⠈⠻⢶⣤⣤⣤⣶⣿⣿⣿⣿⣿⣿⠿⠋
       ⠈⠉⠛⠛⠛⠛⠛⠉⠉

BANNER
}

main() {
  # If already installed via npm, update through npm instead
  if command -v npm >/dev/null 2>&1 && npm list -g @titrate/plug >/dev/null 2>&1; then
    current=$(plug --version 2>/dev/null || echo "unknown")
    npm update -g @titrate/plug --silent
    updated=$(plug --version)
    echo "plug updated from ${current} to ${updated}"
    return
  fi

  banner

  platform=$(detect_platform)
  artifact="plug-${platform}"

  # Fetch the latest release version and download URL
  release_json=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest")
  version=$(echo "$release_json" | grep '"tag_name"' | cut -d '"' -f 4)
  download_url=$(echo "$release_json" | grep "browser_download_url.*${artifact}\"" | cut -d '"' -f 4)

  if [ -z "$download_url" ]; then
    echo "No binary found for ${platform}" >&2
    echo "Try: npm install -g @titrate/plug" >&2
    exit 1
  fi

  echo "  Installing plug ${version}..."

  mkdir -p "$INSTALL_DIR"

  curl -fsSL "$download_url" -o "${INSTALL_DIR}/plug"
  chmod +x "${INSTALL_DIR}/plug"

  add_to_path

  echo "  Installed. See you at plug.audio"
  echo
}

main
