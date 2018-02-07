#!/usr/bin/env node
let Yargs = require('Yargs');
let $ = require('shelljs');
let Path = require('path');
let OpenType = require('opentype.js');
let SanitizeFilename = require('sanitize-filename');

function main() {
    let argv = Yargs
        .options({
            n: {
                alias: 'dry-run',
                type: 'boolean'
            },
            d: {
                alias: 'directory',
                type: 'string'
            }
        })
        .help('h')
        .alias('h', 'help')
        .argv;

    let cd = $.cd(argv.directory);
    if (cd.stderr) return;

    $.config.silent = true;

    let fonts = $.ls(['*.ttf', '*.otf', '.*.ttf', '.*.otf']);
    for (let fileName of fonts) {
        OpenType.load(fileName, (err, font) => {
            if (err) {
                console.error(`${fileName} could not be loaded`);
                return;
            }
            if (!font.names.postScriptName) {
                console.error(`${fileName} does not contain PostScript names`);
                return;
            }
            let psName = font.names.postScriptName.en;
            if (!psName) {
                console.error(`${fileName} does not contain an English PostScript name`);
                return;
            }

            let filePathObj = Path.parse(fileName);
            if (filePathObj.name == psName) return;
            let destFileName = SanitizeFilename(`${psName}${filePathObj.ext}`);

            console.log(`${argv.dryRun? 'Would rename' : 'Renaming'} ${fileName} to ${destFileName}`);
            if (!argv.dryRun) $.mv(fileName, destFileName);
        });
    }
}

if (require.main === module) main();
