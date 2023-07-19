const { spawn } = require("child_process");

const exec = (commands) => {
    spawn(commands, { stdio: "inherit", shell: true })
        .on("data", data => console.log(data , "### data"))
        .on('close', code => process.exit(code))
        .on('error', spawnError => console.error(spawnError));
};

process.argv[2] && exec(`rm -rf release; npm run build && electron-builder build --config app/build-config.js ${process.argv[2]} --publish never`);