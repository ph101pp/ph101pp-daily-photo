import { selector } from "recoil";
import { ManifestType } from "../_types/ManifestType";

const manifestAtom = selector<ManifestType | null>({
  key: "manifestAtom",
  get: () => {
    return fetch("/api/manifest")
    .then(response => response.json())
    .then(manifest =>{
      console.log(manifest);
      if(ManifestType.is(manifest)) {
        return manifest;
      }
      else {
        console.error(ManifestType.validate(manifest)[0]);
        return null;
      }
    })
    .catch(e=>{
      console.error("Failed to fetch manifest", e);
      return null;
    });
  }
});

export default manifestAtom;
