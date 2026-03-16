#!/bin/sh
set -e

REPO="titraterecords/plug"
INSTALL_DIR="${HOME}/.plug/bin"

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

main() {
  platform=$(detect_platform)
  artifact="plug-${platform}"

  echo "Downloading plug for ${platform}..."

  download_url=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
    | grep "browser_download_url.*${artifact}\"" \
    | cut -d '"' -f 4)

  if [ -z "$download_url" ]; then
    echo "No binary found for ${platform}" >&2
    echo "Try: npm install -g @titrate/plug" >&2
    exit 1
  fi

  mkdir -p "$INSTALL_DIR"

  curl -fsSL "$download_url" -o "${INSTALL_DIR}/plug"
  chmod +x "${INSTALL_DIR}/plug"

  add_to_path

  echo "plug installed to ${INSTALL_DIR}/plug"
  "${INSTALL_DIR}/plug" --version
}

main
