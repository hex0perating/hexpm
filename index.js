import axios from "https://deno.land/x/axiod/mod.ts";

import installer from "./makeWorld.js";

let argv = Deno.args;

let server = "https://hexpm.glitch.me/";

if (Deno.env.get("HEXPM_DEBUG") !== undefined) {
    console.log("HEXPM_DEBUG is set! Setting server to localhost...");
    server = "http://localhost/";
}

let pkgApi = {
    sleep: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    readLine: function (question) {
        return new Promise(async (resolve, reject) => {
            const input = await prompt(question);
    
            resolve(input)
        })
    },
    runShell: function(cmd) {
        return new Promise(async (resolve, reject) => {
            const p = Deno.run({
                cmd: cmd.split(" ")
            });
    
            const code = await p.status();
    
            resolve(code);
        });
    },
    installAUR: async function(origCMD) {
        if (typeof origCMD == "object") {
            throw("pkgApi.installAUR was passed an object, not a string.");
        } 
        
        let cmd = origCMD.split(" ");
        let SyuCheck = cmd[0];

        let Packages = cmd;
        Packages.splice(0, 1);
        
        if (SyuCheck == undefined) {
            console.error("You need to specify arguments!\nExample: hexpm aur -Syu discord");
            Deno.exit(1);
        }

        let pacmanPackages = [];
        let aurPackages = [];
        
        console.log(":: Checking status of AUR packages...");
        for (var i = 0; i < Packages.length; i++) {
            const cmd = Deno.run({
                cmd: `git ls-remote https://aur.archlinux.org/${Packages[i]}.git`.split(" "), 
                stdout: "piped",
                stderr: "piped"
            });
              
            const output = await cmd.output();
            const outStr = new TextDecoder().decode(output);
            
            if (outStr == "") {
                pacmanPackages.push(Packages[i]);
            } else {
                aurPackages.push(Packages[i]);
            }
        }

        if (SyuCheck.startsWith("-Sy")) {
            SyuCheck = SyuCheck.replaceAll("y", "");
            await pkgApi.runShell("sudo pacman -Sy");
        }

        if (pacmanPackages.length !== 0) {
            let cmd = `sudo pacman ${SyuCheck} ${pacmanPackages.join(" ")}`;
            await pkgApi.runShell(cmd);
        }

        if (pacmanPackages.length == 0 && SyuCheck == "-Su") {
            console.log(":: Updating system...");
            await pkgApi.runShell("sudo pacman -Su");
        }

        if (aurPackages.length !== 0) {
            Deno.addSignalListener("SIGINT", async(_) => {
                await pkgApi.sleep(100);
                Deno.exit(1);
            });

            for (var i = 0; i < aurPackages.length; i++) {
                let pkg = aurPackages[i];
                console.log(":: Installing '" + pkg + "'...")

                let cmd = `#!/bin/bash\nrm -rf /tmp/pkgbuild\ngit clone https://aur.archlinux.org/${pkg}.git /tmp/pkgbuild\ncd /tmp/pkgbuild\nmakepkg -si`;
                
                await pkgApi.runShell("rm -rf /tmp/installAUR");
                await Deno.writeTextFile("/tmp/installAUR", cmd);
                
                await pkgApi.runShell("chmod +x /tmp/installAUR");
                await pkgApi.runShell("bash /tmp/installAUR");
            }
        }
    }
}

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
        "optDesc": "'world' is not a real package."
    },
    "aur": {
        "long": "aur",
        "short": "a",
        "description": "Installs packages from the AUR."
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
            } else {
                console.log("Getting package data...");

                let pkgJSON = {};

                try {
                    pkgJSON = await axios.get(server + packagewhat + "/hexpkg.json");
                } catch (e) {
                    console.error("There was an error on the server!");
                    Deno.exit(1);
                } 

                if (pkgJSON.status == 404) {
                    console.error("Package not found!");
                    Deno.exit(1);
                }

                console.log(`Package name: ${pkgJSON.data.name}\n  Package Version: ${pkgJSON.data.version}\n  Package Description: ${pkgJSON.data.description}`);

                let confirm = "";

                if (argv[2] !== "dontask") {
                    confirm = await pkgApi.readLine("Install this package? (y/n)");
                } else {
                    confirm = "y";
                }

                if (confirm != "y") {
                    console.log("Package installation cancelled.");
                    Deno.exit(0);
                } else {
                    console.log("Downloading package contents...");
                    let JS = await axios.get(server + packagewhat + "/" + pkgJSON.data.installer);
                    console.log("Installing package...");

                    try {
                        eval(JS.data)
                    } catch (e) {
                        console.error("Package installation failed!");
                        console.error("This is an error with the package itself! Trace:");
                        console.error(e);
                    }
                }
            }
        }
    } else if (parseOpts(0, true) == "search") {
        let some_data = await axios.get(server + "packages.json");

        for await (let data of some_data.data) {
            let name0 = data.name;
            name0 = name0.toLowerCase();
            let name1 = argv[1];
            if (name1 == undefined) {
                console.log("Missing argument at position 1.")
                await args.showHelp();
                Deno.exit(1);
            }
            name1 = name1.toLowerCase();
            if (name0.startsWith(name1)) {
                let msg = data.name;
                msg += ":\n";
                msg += "    Version: " + data.version + "\n";
                msg += "    Description: " + data.description;
                
                console.log(msg)
            }
        }
    } else if (parseOpts(0, true) == "aur") {
        let cmd = [];
        // this is the only thing that works. WTF?
        for (var i = 0; i < argv.length; i++) {
            if (i !== 0) cmd.push(argv[i]);
        }

        cmd = cmd.join(" ");

        await pkgApi.installAUR(cmd);
    } else {
        console.log("Unknown argument: " + argv[0]);
        args.showHelp();
        Deno.exit(1);
    }
}

main();