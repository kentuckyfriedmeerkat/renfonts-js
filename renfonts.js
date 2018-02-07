#!/usr/bin/env node
// Requires
let Yargs = require('Yargs');
let $ = require('shelljs');
let Path = require('path');
let OpenType = require('opentype.js');
let SanitizeFilename = require('sanitize-filename');
let AsciiProgress = require('ascii-progress');
let FS = require('fs');

// begin over-engineering
function main() {
    // Parse command-line arguments
    let argv = Yargs
        .options({
            n: {
                alias: 'dry-run',
                type: 'boolean',
                describe: 'Don\'t actually rename the files, just show what would happen'
            },
            d: {
                alias: 'directory',
                type: 'string',
                describe: 'Specify a directory containing the fonts to rename'
            }
        })
        .help('h') // halp
        .alias('h', 'help')
        .argv;

    // Pretending to be a shell bc it's comfortable and nostalgic
    let cd = $.cd(argv.directory);
    if (cd.stderr) return; // directory doesn't exist = this is a futile exercise

    $.config.silent = true; // stfu

    // should probably rewrite this as a glob
    let fonts = $.ls(['*.ttf', '*.otf', '.*.ttf', '.*.otf']); // covering all the bases

    // reassurance bc this script is SLOW af
    let bar = new AsciiProgress({
        schema: '[:current/:total] :percent :bar',
        filled: '=',
        total: fonts.length
    });
    // The meat and potatoes of the script
    for (let fileName of fonts) {
        bar.tick(); // another one bites the dust
        let font = {};
        try { font = OpenType.parse(FS.readFileSync(fileName).buffer); }
        catch (err) {
            // up the creek
            console.error(`${fileName}: ${err}`);
            continue;
        }
        if (!font.supported) {
            console.error(`${fileName} is an unsupported font`);
            continue;
        }
        if (!font.names.postScriptName) {
            console.error(`${fileName} does not contain PostScript names`);
            continue;
        }
        let psName = font.names.postScriptName.en;
        if (!psName) {
            console.error(`${fileName} does not contain an English PostScript name`);
            continue;
        }

        // Path magic (??)
        let filePathObj = Path.parse(fileName);
        if (filePathObj.name == psName) continue; // nothing to see here
        let destFileName = SanitizeFilename(`${psName}${filePathObj.ext}`);

        // The actual renaming
        console.log(`${argv.dryRun? 'Would rename' : 'Renaming'} ${fileName} to ${destFileName}`);
        if (!argv.dryRun) $.mv(fileName, destFileName);
    }
}

// all systems go
if (require.main === module) main();
