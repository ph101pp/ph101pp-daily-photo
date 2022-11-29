import base64ToArrayBuffer from "./base64ToArrayBuffer";


async function bundlrToArweave() {
  // @ts-ignore
  await window.ethereum.enable();
  // @ts-ignore
  const provider = new providers.Web3Provider(window.ethereum)
  await provider._ready();
  const bundlr = new Bundlr("https://node1.bundlr.network", "ethereum", provider);
  await bundlr.ready();
  const data = base64ToArrayBuffer(image.dataURL);
  const tx = bundlr.createTransaction(new Uint8Array(data), {
    tags: [
      { name: "Content-Type", value: "image/jpeg" }
    ]
  })

  const cost = await bundlr.getPrice(tx.size);
  const balance = await bundlr.getLoadedBalance();

  console.log(balance.toNumber(), cost.toNumber());

  if (balance.lt(cost)) {
    await bundlr.fund(cost.multipliedBy(5));
  }
  await tx.sign();

  const uploader = bundlr.uploader.chunkedUploader;

  uploader.on("chunkUpload", (chunkInfo) => {
    console.log(`Uploaded Chunk number ${chunkInfo.id}, offset of ${chunkInfo.offset}, size ${chunkInfo.size} Bytes, with a total of ${chunkInfo.totalUploaded} bytes uploaded.`);
  })
  const result = await uploader.uploadTransaction(tx);



  console.log(result);
  return;
};

export default bundlrToArweave;