import ImageUploading, { ImageUploadingPropsType, ImageListType, ImageType } from "react-images-uploading";
import Exif from "exif-js";
import { useRecoilState } from "recoil";
import base64ToArrayBuffer from "./_helpers/base64ToArrayBuffer";
import imageAtom from "./_atoms/imageAtom";
import Box from "@mui/material/Box";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";

function UploadImage() {
  const [image, setImage] = useRecoilState(imageAtom);

  const onChange: ImageUploadingPropsType["onChange"] = (imageList, addUpdateIndex) => {
    console.log("onChange", imageList, addUpdateIndex)
    if (imageList.length >= 1) {
      const index = (addUpdateIndex && addUpdateIndex[0]) ?? imageList.length - 1;
      const image = imageList[index];
      if (image.dataURL) {
        const data = image.dataURL.replace("data:image/jpeg;base64,", "");
        return setImage({
          image,
          dataURL: image.dataURL,
          exif: Exif.readFromBinaryFile(base64ToArrayBuffer(data))
        });
      }
    }
    setImage(null);
  };

  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography variant="h6">Upload Image</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <ImageUploading
          value={image ? [image.image] : []}
          onChange={onChange}
          maxNumber={1}
          dataURLKey="dataURL"
          acceptType={["jpg"]}
        >
          {({
            imageList,
            onImageUpload,
            onImageRemoveAll,
            onImageUpdate,
            onImageRemove,
            isDragging,
            dragProps
          }) => {
            // write your building UI
            return (<Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {image && (
                <Box
                  component="img"
                  sx={{
                    width: "auto",
                    maxHeight: "400px",
                    maxWidth: "100%",
                  }}
                  onClick={() => {
                    onImageRemoveAll();
                    onImageUpdate(0)
                  }}
                  src={image.dataURL}
                />
              )}
              {!image && (
                <Box
                  {...dragProps}
                  sx={{
                    height: "400px",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "5px dashed grey",
                    background: "#333"
                  }}
                  onClick={onImageUpload}
                >
                  <Typography variant="h6">{isDragging ? "Drop Image" : "Upload Image"}</Typography>
                </Box>
              )}
              {/* <button
          style={isDragging ? { color: "red" } : undefined}
          onClick={onImageUpload}
          {...dragProps}
        >
          Click or Drop here
        </button>
        &nbsp;
        <button onClick={onImageRemoveAll}>Remove all images</button>
        {imageList.map((image, index) => {
          const data = image.data_url?.replace("data:image/jpeg;base64,", "");
          // console.log(Exif.readFromBinaryFile(base64ToArrayBuffer(data ?? "")));

          return (
            <div key={image.data_url} className="image-item">
              <img src={image.data_url} alt="" width="100" />
              <div className="image-item__btn-wrapper">
                <button onClick={() => onImageUpdate(index)}>Update</button>
                <button onClick={() => onImageRemove(index)}>Remove</button>
              </div>
            </div>
          )
        })} */}
            </Box>
            )
          }}
        </ImageUploading>
      </AccordionDetails>
    </Accordion>)
}

export default UploadImage;