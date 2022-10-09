import React, { useState } from "react";
import Layout from "./layout"
import ImageUploading, { ImageUploadingPropsType, ImageListType, ImageType } from "react-images-uploading";
import Exif from "exif-js";
import { useRecoilValue, useRecoilState } from "recoil";
import useArweave from "./_hooks/useArweave";
import arweaveStatusAtom from "./_atoms/arweaveStatusAtom";
import base64ToArrayBuffer from "./_helpers/base64ToArrayBuffer";
import imageAtom from "./_atoms/imageAtom";


// await octokit.repos.getContent({
//   owner: context.owner,
//   repo: context.repo,
//   path: change.path
// }).then(file=>{
//   sha = Array.isArray(file.data) || file.status !== 200 ? null: file.data.sha
// }).catch(()=>{});


export default function NewUpload() {

  const uploadToArweave = useArweave(arweaveStatusAtom("uploadImage"));
  const status = useRecoilValue(arweaveStatusAtom("uploadImage"));
  const [image, setImage] = useRecoilState(imageAtom);

  
  const onChange: ImageUploadingPropsType["onChange"] = (imageList, addUpdateIndex) => {
    if(imageList.length >= 1 && imageList[0].dataURL) {
      const image = imageList[0];
      const data = imageList[0].dataURL.replace("data:image/jpeg;base64,", "");
      setImage({
        image,
        dataURL: imageList[0].dataURL,
        exif: Exif.readFromBinaryFile(base64ToArrayBuffer(data))
      });
    }
  };

  return (
    <Layout>
      <ImageUploading
        value={image?[image.image]:[]}
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
        }) => (
          // write your building UI
          <div className="upload__image-wrapper">
            <button
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
            })}
          </div>
        )}
      </ImageUploading>
      {image &&
        <button onClick={() => uploadToArweave(image.dataURL)}>Upload to Arweave</button>
      }
      {status?.transactionId &&
        <a href={`https://arweave.net/${status.transactionId}`}>{status.transactionId}</a>
      }
    </Layout>
  )
}
