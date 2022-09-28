import React, { useCallback, useState } from "react";
import Layout from "../components/layout"
import ImageUploading, { ImageUploadingPropsType, ImageListType } from "react-images-uploading";
import Exif from "exif-js";
import Arweave from "arweave";

const delay = (time:number) => new Promise(res=>setTimeout(res,time));

function base64ToArrayBuffer(base64:string) {
  base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
  var binary = atob(base64);
  var len = binary.length;
  var buffer = new ArrayBuffer(len);
  var view = new Uint8Array(buffer);
  for (var i = 0; i < len; i++) {
      view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

const arweave = Arweave.init({});

export default function IndexPage() {

  const [images, setImages] = useState<ImageListType>([]);
  const [transactionId, setTransactionId] = useState<string>();
  const maxNumber = 1;
  const onChange: ImageUploadingPropsType["onChange"] = (imageList, addUpdateIndex) => {
    // data for submit
    setImages(imageList);
  };

  const uploadToArweave = useCallback(async ()=>{
    const dataB64 = images[0].data_url?.replace("data:image/jpeg;base64,", "");

    let data = base64ToArrayBuffer(dataB64);
    console.log(data);
    let transaction = await arweave.createTransaction({ data: data });
    transaction.addTag('Content-Type', 'image/jpeg');
    await arweave.transactions.sign(transaction);
    let uploader = await arweave.transactions.getUploader(transaction);
    console.log(transaction);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
    }
    console.log(uploader);
    let status;
    do {
      status = await arweave.transactions.getStatus(transaction.id);
      console.log(status);
      await delay(1000);
    } while(!status?.confirmed || status.confirmed.number_of_confirmations < 5);
    setTransactionId(transaction.id);
  }, [images]);

  return (
    <Layout>
      <ImageUploading
        value={images}
        onChange={onChange}
        maxNumber={maxNumber}
        dataURLKey="data_url"
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
              
              console.log(Exif.readFromBinaryFile(base64ToArrayBuffer(data??"")));


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
      {images.length === 1 && 
        <button onClick={() => uploadToArweave()}>Upload to Arweave</button>
      }
      { transactionId && 
        <a href={`https://arweave.net/${transactionId}`}>{transactionId}</a> 
      }
    </Layout>
  )
}
