const readline = require('readline');
const fs = require("fs");
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readLine(question) {
    return new Promise((resolve, reject) => {
        let ans = "";
        let rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(question, (answer) => {
            ans = answer;
            rl.close();
            resolve(ans);
        })
    })
}

async function runShell(cmd) {
    return new Promise((resolve, reject) => {
        let exec_arr = cmd.split(" ");
        let exec_cmd = exec_arr[0];
        exec_arr.shift();
        var spawn = require('child_process').spawn,
            ls    = spawn(exec_cmd, exec_arr, { stdio: 'inherit' });

        ls.on('exit', function (code) {
            resolve(code);
        });
    });
}

module.exports = async function() {
    console.log("Welcome to the hex0s installer!");
    console.log("This will install Arch Linux and the hex0s layer on your computer.");
    console.log("First, we need to partition your disk.");
    await runShell("lsblk");
    console.log("WARNING: This will delete all data on the drive!");
    let part = await readLine("Please enter the disk you want to install to (e.g. sda): ");
    part = `/dev/${part}`;

    console.log("WARNING: You will have a 5 second timer before the partitioning starts.\nThis will erase ALL data!");
    console.log("To cancel, press CTRL+C!");
    process.stdout.write("Partitioning in 5");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".4");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".3");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".2");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".1");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".");
    await sleep(250);
    process.stdout.write(".0.\nPartitioning now!\n");

    console.log("partition: unmounting drives...");
    let drvs = await fs.readdirSync("/dev/");

    let part1 = "";
    let part2 = "";

    for await (drv of drvs) {
        if (drv.startsWith(part.replace("/dev/", "")) && drv !== part.replace("/dev/", "")) {
            console.log("partition: attempting to unmount", drv);
            await runShell(`umount /dev/${drv}`);
            console.log("partition: unmounted", drv);
        }
    }

    console.log("partition: initializing drive...");
    if (part.startsWith("/dev/sd") || part.startsWith("/dev/hd") || part.startsWith("/dev/vd")) {
        part1 = part + 1;
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
    await runShell(`mkfs.ext4 ${part2}`);
    console.log("partition: initialized drive");
}