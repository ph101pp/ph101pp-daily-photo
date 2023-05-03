
const range = [2, 3];
const contract = "0x74F5ab6D014AEa53448B4CB8A735ae9B29b5AAe3";
const baseURI = "https://testnets-api.opensea.io";
// const baseURI = "https://api.opensea.io";

///////////////////////////////////////////////////////////////////////////////

const getURL = (i:number)=>`${baseURI}/api/v1/asset/${contract}/${i}?force_update=true`;

const wait = (time:number)=>new Promise<void>((resolve)=>{
  setTimeout(()=>{resolve()}, time);
});

(async ()=>{
  for(let i= range[0]; i<=range[1];i++) {
    const resp = await (await fetch(getURL(i))).json();
    console.log(i, resp);
    await wait(1000);
  }
})()
