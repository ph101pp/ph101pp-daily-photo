import ImageUploading, { ImageUploadingPropsType, ImageListType, ImageType } from "react-images-uploading";
import Exif from "exif-js";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import base64ToArrayBuffer from "./_helpers/base64ToArrayBuffer";
import imageAtom from "./_atoms/imageAtom";
import Box from "@mui/material/Box";
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material";
import tokenMetadataInputAtom from "./_atoms/tokenMetadataAtom";
import defaultTokenMetadataInputAtom from "./_atoms/defaultTokenMetadataInputAtom";
import { useForm } from "react-hook-form";

function UploadImage({ title }: { title: string }) {
  const [image, setImage] = useRecoilState(imageAtom);

  const onChange: ImageUploadingPropsType["onChange"] = (imageList, addUpdateIndex) => {
    if (imageList.length >= 1) {
      const index = (addUpdateIndex && addUpdateIndex[0]) ?? imageList.length - 1;
      const image = imageList[index];
      if (image.dataURL && image.file) {
        const data = image.dataURL.replace("data:image/jpeg;base64,", "");
        setImage({
          type: "new",
          image,
          file: image.file,
          dataURL: image.dataURL,
          exif: Exif.readFromBinaryFile(base64ToArrayBuffer(data))
        });
        return;
      }
    }
    setImage(null);
  };


  return (
    <Accordion defaultExpanded={true}>
      <AccordionSummary>
        <Typography variant="h6">{`Upload Image: ${title}`}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {image?.type === "existing" ? (
            <Box
              component="img"
              sx={{
                width: "auto",
                maxHeight: "400px",
                maxWidth: "100%",
              }}
              onClick={() => {
                // setMetadataInput(null);
                // setDefaultMetadataInput(null);        
                setImage(null);
              }}
              src={`https://arweave.net/${image.existingArHash}`}
            />

          ) : (
            <ImageUploading
              value={image ? [image.image] : []}
              onChange={onChange}
              maxNumber={1}
              dataURLKey="dataURL"
              acceptType={["jpg", "jpeg"]}
            >
              {
                ({
                  imageList,
                  onImageUpload,
                  onImageRemoveAll,
                  onImageUpdate,
                  onImageRemove,
                  isDragging,
                  dragProps
                }) => {
                  // write your building UI
                  return (<>
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
                  </>
                  )
                }}
            </ImageUploading>
          )}
        </Box>
      </AccordionDetails >
    </Accordion >)
}

export default UploadImage;