import { mkdir, copyFile, readdir, stat, writeFile, rename, readFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "public/mediapipe");
const source = path.join(root, "node_modules/@mediapipe/tasks-vision");
const model = path.join(root, "public/models/pose_landmarker_lite.task");
const modelUrl = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const expectedHash = "59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a";
const sha256 = data => createHash("sha256").update(data).digest("hex");
await mkdir(path.join(output, "wasm"), { recursive: true });
await mkdir(path.dirname(model), { recursive: true });
for (const file of await readdir(path.join(source, "wasm"))) {
  if (/\.(js|wasm)$/.test(file)) await copyFile(path.join(source, "wasm", file), path.join(output, "wasm", file));
}
await copyFile(path.join(source, "vision_bundle.js"), path.join(output, "vision_bundle.js"));
try {
  if (!(await stat(model).catch(() => null))?.size) {
    const response = await fetch(modelUrl, { signal: AbortSignal.timeout(60000) });
    if (!response.ok) throw new Error(`Model download returned HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (sha256(bytes) !== expectedHash) throw new Error("Model checksum did not match the pinned lite model");
    await writeFile(`${model}.tmp`, bytes);
    await rename(`${model}.tmp`, model);
  }
  if (sha256(await readFile(model)) !== expectedHash) throw new Error("Local model checksum failed. Remove the corrupt model and run setup:mediapipe again.");
  const { version } = JSON.parse(await readFile(path.join(source, "package.json"), "utf8"));
  const files = ["vision_bundle.js", ...(await readdir(path.join(output, "wasm"))).map(file => `wasm/${file}`)];
  const assets = [];
  for (const name of files) assets.push({ name, sha256: sha256(await readFile(path.join(output, name))) });
  await writeFile(path.join(output, "assets.json"), JSON.stringify({ version, model: modelUrl, modelSha256: expectedHash, assets }, null, 2) + "\n");
  console.log(`Self-hosted MediaPipe ${version} and verified lite model ready.`);
} catch (error) {
  await rm(`${model}.tmp`, { force: true });
  console.error(`MediaPipe setup failed: ${error.message}\nRequired model: ${modelUrl}\nDestination: ${model}`);
  process.exitCode = 1;
}
