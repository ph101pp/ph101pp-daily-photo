import { selector } from "recoil";
import { ArwalletType } from "../_types/ArwalletType";
import { ManifestType } from "../_types/ManifestType";


const arwalletAtom = selector<ArwalletType | null>({
  key: "arwalletAtom",
  get: () => {
    return fetch("/api/arwallet", { method: "POST" })
      .then(response => response.text())
      .then(arwalletB64 => {
        const arwallet = JSON.parse(atob(arwalletB64.slice(10, -10)));
        if (ArwalletType.is(arwallet)) {
          return arwallet;
        }
        else {
          console.error(ManifestType.validate(arwallet)[0]);
          return null;
        }
      })
      .catch(e => {
        console.error("Error", e);
        return null;
      });
  }
});

export default arwalletAtom;
