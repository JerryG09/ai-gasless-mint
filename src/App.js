import { useState } from "react";
import axios from "axios";
import { NFTStorage } from "nft.storage";
import { cleanupIPFS } from "./utils/formatUrl";
import { Spinner } from "./components/Spinner";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

function App() {
  const [prompt, setPrompt] = useState("");
  const [imageBlob, setImageBlob] = useState(null);
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [minted, setMinted] = useState(false);

  const uploadArtToIpfs = async () => {
    try {
  
      const nftstorage = new NFTStorage({
        token: process.env.REACT_APP_NFT_STORAGE,
      })
  
      const store = await nftstorage.store({
        name: "AI NFT",
        description: "AI generated NFT",
        image: file
      })

      console.log({store})
  
      return cleanupIPFS(store.data.image.href)
  
    } catch(err) {
      console.log(err)
      return null
    }
  }  

  const generateArt = async () => {
    if (prompt.length < 3) {
      toast.error('input must be minimum 3 characters')
      return;
    }
    setIsGenerating(true);
    try {
      const response = await axios.post(
        `https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5`,
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE}}`,
          },
          method: "POST",
          inputs: prompt,
        },
        { responseType: "blob" }
      );
      // convert blob to a image file type
      const file = new File([response.data], "image.png", {
        type: "image/png",
      });
      setFile(file);
      const url = URL.createObjectURL(response.data);
      setImageBlob(url);
      setIsGenerating(false);
      setPrompt('')
    } catch (err) {
      console.log(err);
    }
  };

  const mintNft = async () => {
    try {
      const imageURL = await uploadArtToIpfs();
  
      // mint as an NFT on nftport
      const response = await axios.post(
        `https://api.nftport.xyz/v0/mints/easy/urls`,
        {
          file_url: imageURL,
          chain: "polygon",
          name: "Sample NFT",
          description: "Build with NFTPort!",
          mint_to_address: "0x627306090abaB3A6e1400e9345bC60c78a8BEf57",
        },
        {
          headers: {
            Authorization: process.env.REACT_APP_NFT_PORT,
          }
        }
      );
      const data = await response.data;
      setMinted(true)
      console.log(data);
    } catch (err) {
      console.log(err);
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-extrabold">AI Art Gasless mints</h1>
      <div className="flex flex-col items-center justify-center">
        {/* Create an input box and button saying next beside it */}
        <div className="flex items-center justify-center gap-4">
          <input
            className="border-2 border-black rounded-md p-2"
            onChange={(e) => setPrompt(e.target.value)}
            type="text"
            placeholder="Enter a prompt"
            disabled={isGenerating || imageBlob}
          />
          {!imageBlob && (
            <button
              onClick={generateArt}
              className={`bg-black text-white rounded-md p-2 cursor-pointer`}
              disabled={isGenerating || imageBlob}
            >
              {isGenerating && (<Spinner />)}
              {!isGenerating && <span>Next</span>}
            </button>
          )}
        </div>
        {isGenerating && (
          <div className="mt-4 h-80 w-80 rounded-md">
            <Skeleton style={{height: '100%', width: '100%'}} />
          </div>
        )}
       
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
