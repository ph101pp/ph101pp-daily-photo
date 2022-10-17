export type TokenMetadataInputType = {
  settings: string,
  camera: string,
  place: string,
  country: string,
  description: string,
  image_details: {
    size: number,
    type: string,
    width: number,
    height: number,
    sha256: string
  }
}