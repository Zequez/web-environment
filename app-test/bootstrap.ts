#!/usr/bin/env bun

import { spawn } from 'bun'
import { join } from 'path'
import { mkdirSync, existsSync, createWriteStream } from 'fs'
import { tmpdir } from 'os'
import { execSync } from 'child_process'
import https from 'https'

// ---- CONFIG ----
const REQUIRED_VERSION = '1.2.23' // change this as needed
const CACHE_DIR = join(tmpdir(), 'bun-cache') // e.g. /var/folders/.../bun-cache
const SCRIPT_TO_RUN = join(process.cwd(), 'myscript.ts') // replace with Z
const FORCE_DOWNLOADED = true

// GitHub release URL pattern (simplified)
function bunDownloadURL(version: string): string {
  const platform = process.platform // "darwin" | "linux" | "win32"
  const arch = process.arch // "x64" | "arm64"

  let osPart: string
  let archPart: string

  if (platform === 'darwin') {
    osPart = 'darwin'
    archPart = arch === 'arm64' ? 'aarch64' : 'x64'
  } else if (platform === 'linux') {
    osPart = 'linux'
    archPart = arch === 'arm64' ? 'aarch64-musl' : 'x64'
  } else if (platform === 'win32') {
    osPart = 'windows'
    archPart = arch === 'arm64' ? 'aarch64' : 'x64'
  } else {
    throw new Error(`Unsupported platform: ${platform} ${arch}`)
  }

  // Build the filename
  const filename = `bun-${osPart}-${archPart}.zip`

  return `https://github.com/oven-sh/bun/releases/download/bun-v${version}/${filename}`
}

// ---- STEP 1. Check if bun on PATH ----
function getSystemBunVersion(): string | null {
  try {
    const output = execSync('bun --version').toString().trim()
    return output
  } catch {
    return null
  }
}

function versionIsOk(ver: string): boolean {
  // naive compare, could use semver lib
  return ver >= REQUIRED_VERSION
}

// ---- STEP 2. Ensure cached bun exists ----
function cachedBunPath(): string {
  const archFolder = process.arch === 'arm64' ? 'aarch64' : 'x64'
  const platformFolder =
    process.platform === 'darwin' ? 'darwin' : process.platform
  return join(CACHE_DIR, `bun-${platformFolder}-${archFolder}`, 'bun')
}

async function ensureCachedBun(): Promise<string> {
  if (existsSync(cachedBunPath())) {
    return cachedBunPath()
  }

  console.log('Downloading Bun...')

  mkdirSync(CACHE_DIR, { recursive: true })
  const url = bunDownloadURL(REQUIRED_VERSION)
  console.log('Downloading', url)
  const dest = join(CACHE_DIR, `bun.zip`)
  console.log('Downloading to ', dest)

  await downloadFile(url, dest)

  console.log('Extracting Bun...')

  execSync(`unzip -o ${dest} -d ${CACHE_DIR}`)

  return cachedBunPath()
}

async function downloadFile(url: string, outputPath: string) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    // Get the file content as a Blob
    const fileBlob = await response.blob()

    // Write the Blob content to a local file
    await Bun.write(outputPath, fileBlob)

    console.log(`File downloaded successfully to: ${outputPath}`)
  } catch (error) {
    console.error('Error during file download:', error)
  }
}

// ---- STEP 3. Main logic ----
async function main() {
  console.log(`Bun ${REQUIRED_VERSION} required`)
  if (!FORCE_DOWNLOADED) {
    const sysVer = getSystemBunVersion()
    if (sysVer && versionIsOk(sysVer)) {
      console.log(`Using system Bun v${sysVer}`)
      execSync(`bun run "${SCRIPT_TO_RUN}"`, { stdio: 'inherit' })
      return
    }

    console.log('System Bun missing or too old, checking cache...')
  } else {
    console.log('Forcing downloaded Bun version...')
  }
  const bunBin = await ensureCachedBun()

  console.log('Running script with cached Bun...')
  execSync(`${bunBin} run "${SCRIPT_TO_RUN}"`, { stdio: 'inherit' })
}

main()
