import axios from "https://deno.land/x/axiod/mod.ts";
import {parse} from "https://deno.land/std@0.83.0/flags/mod.ts";

import installer from "./makeWorld.js";

let argv = Deno.args;

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
        "optDesc": "With the argument as 'world', it will attempt to install the base hex0s system.\nAfter the package name, if you specify 'dontask', it will not confirm your installation.\nNote that packages may still ask for prompts."
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
    "showHelp": async function() {
        console.log("Usage: ");

        for (let arg_name in args) {
            let lazy = "";
            let arg = args[arg_name];
    
            if (typeof arg == "function") break;
    
            lazy += "  " + arg.long + " (" + arg.short + ") - " + arg.description;
    
            if (arg.optDesc) {
                lazy += "\n   " + arg.optDesc.replaceAll("\n", "\n   ");
            }

            console.log(lazy);
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
    
        Deno.exit(1);
    } else if (parseOpts(0, true) == "install") {
        if (argv[1] == undefined) {
            console.log("No package name provided.");
            args.showHelp();
            Deno.exit(1);
        } else {
            let packagewhat = argv[1];
    
            if (packagewhat == "world") {
                await installer();
            }
        }
    } else {
        console.log("Unknown argument: " + argv[0]);
        args.showHelp();
        Deno.exit(1);
    }
}

main();