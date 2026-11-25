// typedoc を監視モードで動かし、生成された docs を browser-sync で配信して自動で再読み込みさせる。

const run = (args: string[]) =>
  Bun.spawn([process.execPath, "x", ...args], {
    stdio: ["inherit", "inherit", "inherit"],
  });

const processes = [
  run([
    "typedoc",
    "--options",
    "scripts/typedoc.json",
    "--watch",
    "--preserveWatchOutput",
  ]),
  // typedoc は1回の再生成で多数のファイルを書くため、書き終わるまで再読み込みを待たせる
  run([
    "browser-sync",
    "start",
    "--server",
    "docs",
    "--files",
    "docs",
    "--reload-debounce",
    "500",
    "--no-notify",
    "--no-ui",
  ]),
];

const stopAll = () => {
  for (const p of processes) p.kill();
};
process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});

await Promise.race(processes.map((p) => p.exited));
stopAll();
