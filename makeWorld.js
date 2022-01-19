import { readline } from "https://deno.land/x/readline/mod.ts";
import axios from "https://deno.land/x/axiod/mod.ts";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readLine(question) {
    return new Promise(async (resolve, reject) => {
        const input = await prompt(question);

        resolve(input)
    })
}

async function runShell(cmd) {
    return new Promise(async (resolve, reject) => {
        const p = Deno.run({
            cmd: cmd.split(" ")
        });

        const code = await p.status();


        resolve(code);
    });
}

export default async function() {
    console.log("Welcome to the hex0s installer!");
    console.log("This will install Arch Linux and the hex0s layer on your computer.");
    console.log("First, we need to partition your disk.");
    await runShell("lsblk");
    console.log("WARNING: This will delete all data on the drive!");
    let part = await readLine("Please enter the disk you want to install to (e.g. sda):");
    part = `/dev/${part}`;

    console.log("WARNING: You will have a 5 second timer before the partitioning starts.\nThis will erase ALL data!");
    console.log("To cancel, press CTRL+C!");
    console.log("Starting timer now...");
    await sleep(5000);
    console.log("partition: unmounting drives...");
    let drvs = await Deno.readDir("/dev");

    let part1 = "";
    let part2 = "";

    for await (let drv of drvs) {
        if (drv.name.startsWith(part.replace("/dev/", "")) && drv.name !== part.replace("/dev/", "")) {
            console.log("partition: attempting to unmount", drv.name);
            await runShell(`umount /dev/${drv.name}`);
            console.log("partition: unmounted", drv.name);
        }
    }

    console.log("partition: initializing drive...");
    if (part.startsWith("/dev/sd") || part.startsWith("/dev/hd") || part.startsWith("/dev/vd")) {
        part1 = part + 1;
        part2 = part + 2;
    } else if (part.startsWith("/dev/mmcblk")) {
        part1 = part + "p1";
        part2 = part + "p2";
    } else if (part.startsWith("/dev/nvme")) {
        part1 = part + "p1";
        part2 = part + "p2";
    }

    await runShell(`parted -s ${part} mklabel gpt`);
    await runShell(`parted -s ${part} mkpart primary 0% 1G`);
    await runShell(`parted -s ${part} mkpart primary 1G 100%`);
    console.log("partition: partitioning complete! waiting for drive to be ready...");
    await sleep(2500);
    console.log("partition: changes should be saved now!");
    await runShell(`mkfs.fat -F32 ${part1}`);
    console.log("partition: type 'y' if prompted")
    await runShell(`mkfs.ext4 ${part2}`);
    console.log("partition: initialized drive.");
    console.log("Mounting root...");
    await runShell(`mount ${part2} /mnt`);
    console.log("Mounted root.");

    let username = await readLine("Please enter your new username:");
    let password = await readLine("Please enter your new password:");
    let hostname = await readLine("Please enter your new hostname:");

    await runShell(`pacstrap /mnt base base-devel linux linux-firmware`); // networkmanager nm-applet
    const text = await axios.get("https://raw.githubusercontent.com/hex0perating/hexpm/master/makeWorld.sh");
    
    let textFix = text.data.replaceAll("$_USERNAME", username);
    textFix = textFix.replaceAll("$_PASSWORD", password);
    textFix = textFix.replaceAll("$_HOSTNAME", hostname);
    textFix = textFix.replaceAll("$_UEFI_PARTITION", part1);

    await Deno.writeTextFile("/tmp/installer", textFix);

    await Deno.writeTextFile("/tmp/installerinit",  "#!/bin/bash\nchmod +x /tmp/installer\narch-chroot /mnt /tmp/installer");
    await runShell("chmod +x /tmp/installerinit");
    await runShell("bash /tmp/installerinit");
}