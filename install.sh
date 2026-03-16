#!/bin/sh
set -e

REPO="titraterecords/plug"
INSTALL_DIR="/usr/local/bin"

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

main() {
  platform=$(detect_platform)
  artifact="plug-${platform}"

  echo "Downloading plug for ${platform}..."

  # Get latest release download URL
  download_url=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
    | grep "browser_download_url.*${artifact}\"" \
    | cut -d '"' -f 4)

  if [ -z "$download_url" ]; then
    echo "No binary found for ${platform}" >&2
    echo "Try: npm install -g @titrate/plug" >&2
    exit 1
  fi

  # Download to temp file
  tmp=$(mktemp)
  curl -fsSL "$download_url" -o "$tmp"
  chmod +x "$tmp"

  # Move to install dir (may need sudo)
  if [ -w "$INSTALL_DIR" ]; then
    mv "$tmp" "${INSTALL_DIR}/plug"
  else
    echo "Installing to ${INSTALL_DIR} (requires sudo)..."
    sudo mv "$tmp" "${INSTALL_DIR}/plug"
  fi

  echo "plug installed to ${INSTALL_DIR}/plug"
  plug --version
}

main
