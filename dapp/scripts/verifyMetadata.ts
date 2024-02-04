import Arweave from "arweave";
import { webcrypto } from "crypto"
import fs from "fs";

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

execute();
async function execute() {


  const verify = process.cwd() + "/../verify.txt";
  const dirname = process.cwd() + "/../TOKEN_METADATA";
  const tokens = fs.readdirSync(dirname);

  console.log(tokens.length);

  for (let i = 291; i < 292; i++) {
    const token = tokens[i];
    if (token === ".DS_Store") {
      continue
    }
    const metadata = fs.readFileSync(dirname + "/" + token).toString("utf-8");
    const data = JSON.parse(metadata.replace(/\n/g, ""));

    // console.log(data.image, data.image_details)

    const image = await arweave.transactions.getData(data.image.replace("ar://", ""), { decode: true }) as Uint8Array
    const hash = await sha256("data:image/jpeg;base64," + Buffer.from(image).toString("base64"));


    // console.log(image.byteLength, hash);
    fs.appendFileSync(verify, `${token}, ${data.image_details.size === image.byteLength}, ${hash === data.image_details.sha256}
    `);
  }
}
// const data = arweave.transactions.getData("wgyaNi-o60ee2KPmRWwqRxGZ0He6jgM0LaK7YeHsMCw", {decode:true}).then(async (d) => {

//   // @ts-ignore
//   console.log(d.byteLength, await sha256("data:image/jpeg;base64,"+Buffer.from(d).toString("base64")));

// })

async function sha256(text: string): Promise<string> {
  const textAsBuffer = new TextEncoder().encode(text);
  // @ts-ignore
  const hashBuffer = await webcrypto.subtle.digest('SHA-256', textAsBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


function readFiles(dirname: string) {
  const files = fs.readdirSync(dirname);
  console.log(files)
  //   filenames.forEach(function(filename) {
  //     fs.readFile(dirname + filename, 'utf-8', async function(err, content) {
  //       if (err) {
  //         onError(err);
  //         return;
  //       }
  //       onFileContent(filename, content);
  //     });
  //   });
  // });
}