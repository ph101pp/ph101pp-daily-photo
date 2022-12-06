export default function arweaveUrl(uri: string){
  return uri.replace(/^ar:\/\//, "https://arweave.net/");
}