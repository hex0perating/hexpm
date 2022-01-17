const axios = require("axios");

let argv = process.argv.slice(2);

let args = {
    "help": {
        "long": "help",
        "short": "h",
        "description": "Show this help message"
    },
    "install": {
        "long": "install",
        "short": "i",
        "description": "Install a package name",
        "optDesc": "With the argument as 'world', it will attempt to install the base hex0s system."
    },
    "search": {
        "long": "search",
        "short": "s",
        "description": "Search for a package name",
        "optDesc": "Since 'world' is NOT a package, it is blacklisted to prevent accidental use, and/or potential bugs."
    },
    /**
     * shows the help message
     */
    "showHelp": function() {
        console.log("Usage: ");

        for (let arg_name in args) {
            let arg = args[arg_name];
    
            if (typeof arg == "function") break;
    
            process.stdout.write("  " + arg.long + " (" + arg.short + ") - " + arg.description);
    
            if (arg.optDesc) {
                process.stdout.write("\n   " + arg.optDesc);
            }
    
            process.stdout.write("\n");
        }
    }
}

/**
 * gets options from the command line
 * @param {string} index index of args to search for
 * @param {boolean} disableException whether to disable an exception on not finding the index
 * @returns {string} the value of the index, if disableException is true, it will return undefined
 */
function parseOpts(index, disableException) {
    let arg = argv[index];

    if (arg == undefined && !disableException) throw new Error("No argument found at index " + index);

    for (let arg_name in args) {
        let arg = args[arg_name];

        if (typeof arg == "function") break;

        if (arg.long == argv[index] || arg.short == argv[index]) {
            return(arg.long)
        }
    }
}

async function main() {
    if (argv.length == 0 || parseOpts(0, true) == "help") {
        args.showHelp();
    
        process.exit(1);
    } else if (parseOpts(0, true) == "install") {
        if (argv[1] == undefined) {
            console.log("No package name provided.");
            args.showHelp();
            process.exit(1);
        } else {
            let package = argv[1];
    
            if (package == "world") {
                const installer = require("./makeWorld.js");
                await installer();
            }
        }
    }
}

main();