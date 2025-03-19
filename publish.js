#!/usr/bin/env -S node
import { readFile, writeFile, mkdir, readdir, copyFile } from 'fs/promises'
import { JSDOM } from 'jsdom'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath( import.meta.url )
const __dirname = path.dirname( __filename )

const FILE_PATH = path.join( __dirname, process.env.FILE_PATH )
const LIVE_RELOAD_FILE = process.env.LIVE_RELOAD_FILE
const SOURCE_DIR = path.join( __dirname, process.env.SOURCE_DIR )
const DEST_DIR = path.join( __dirname, process.env.DEST_DIR )
const REMOTE_USER = process.env.REMOTE_USER
const REMOTE_HOST = process.env.REMOTE_HOST
const REMOTE_PATH = process.env.REMOTE_PATH
const SSH_KEY_PATH = process.env.SSH_KEY_PATH
const EXCLUDED_FILES = process.env.EXCLUDED_FILES.split( ',' )

async function removeScriptTag() {
  try {
    let data = await readFile( FILE_PATH, 'utf8' )
    const dom = new JSDOM( data )
    const document = dom.window.document

    document.querySelectorAll( 'script' ).forEach( ( script ) => {
      if ( script.src.includes( LIVE_RELOAD_FILE ) ) {
        script.remove()
        console.log( `🔥 Removed <script src="${ script.src }">` )
      }
    } )

    await writeFile( FILE_PATH, dom.serialize(), 'utf8' )
    console.log( '✅ Updated index.html successfully!' )
  } catch ( error ) {
    console.error( 'Error:', error )
  }
}

/**
 * @param {string} src
 * @param {string} dest
 */
async function copyDirectory( src, dest ) {
  try {
    // Create destination directory if it doesn't exist
    await mkdir( dest, { recursive: true } )

    // Read contents of the source directory
    const items = await readdir( src, { withFileTypes: true } )

    for ( const item of items ) {
      const srcPath = path.join( src, item.name )
      const destPath = path.join( dest, item.name )

      if ( EXCLUDED_FILES.includes( item.name ) ) {
        console.log( `🚫 Skipping: ${ item.name }` )
        continue
      }

      if ( item.isDirectory() ) {
        await copyDirectory( srcPath, destPath )
      } else {
        // Copy files
        await copyFile( srcPath, destPath )
        console.log( `✅ Copied: ${ srcPath } → ${ destPath }` )
      }
    }
  } catch ( error ) {
    console.error( 'Error copying directory:', error )
  }
}

function clearRemoteDirectory() {
  return new Promise( ( resolve, reject ) => {
    console.log( '🗑️  Deleting all files in remote public directory...' )

    const sshProcess = spawn( 'ssh', [
      '-i', SSH_KEY_PATH,
      `${ REMOTE_USER }@${ REMOTE_HOST }`,
      `rm -rf ${ REMOTE_PATH }`
    ], { stdio: 'inherit' } )

    sshProcess.on( 'close', ( code ) => {
      if ( code === 0 ) {
        console.log( '✅ Remote directory cleared!' )
        resolve()
      } else {
        reject( new Error( `❌ Failed to clear remote directory (exit code: ${ code })` ) )
      }
    } )
  } )
}

function deployToServer() {
  console.log( '🚀 Deploying to remote server...' )

  const scpProcess = spawn( 'scp', [
    '-i', SSH_KEY_PATH,
    '-r', DEST_DIR,
    `${ REMOTE_USER }@${ REMOTE_HOST }:${ REMOTE_PATH }`
  ], { stdio: 'inherit' })

  scpProcess.on( 'close', ( code ) => {
    if ( code === 0 ) {
      console.log( '🎉 Deployment completed successfully!' )

      console.log( '🤡done!' )
    } else {
      console.error( `❌ Deployment failed with exit code ${ code }` )
    }
  } )
}

copyDirectory( SOURCE_DIR, DEST_DIR ).then( () => {
    console.log( '🎉 Production build is ready!' )
    removeScriptTag().then( () => {
      clearRemoteDirectory().then( () => {
        deployToServer()
      } )
    } ).catch( console.error )

  }
).catch( console.error )

// Run the function
