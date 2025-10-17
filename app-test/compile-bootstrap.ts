#!/usr/bin/env bun

async function runBuild() {
  console.log('Starting build...')
  await Bun.$`bun build --compile --outfile=web-environment ./bootstrap.ts`
  // await Bun.$`vtool -arch x86_64 -set-build-version 1 12.0 12.0 -replace -output web-environment web-environment`
  console.log('Build finished successfully.')
}

runBuild()
