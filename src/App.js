import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import './App.css';
import abi from "./utils/WavePortal.json";

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);
  const [message, setMessage] = useState('');
  const [gift, setGift] = useState('https://media2.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif?cid=ecf05e47i7dqwns4poitqwwzvsyjlwohpotvuvkxd9oadzxi&rid=giphy.gif&ct=g');
  const [count, setCount] = useState(0);

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();


        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }


  const contractAddress = '0x303a1ad911D5f0F42f5eAfcb20c3FAf01A27a736'

  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log('Make sure you have metamask');
        return;
      } else {
        console.log('We have the ethereum object', ethereum)
      }
      const accounts = await ethereum.request({ method: 'eth_accounts' })
      if (accounts.length !== 0) {
        const [account,] = accounts;
        console.log('Found and authorized account', account);
        setCurrentAccount(account);
        await getAllWaves();
      } else {
        console.log('No authorized account found');
      }
    } catch(error){
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave(message);
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        setCount(count.toNumber())
        await getGifs()
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const fromApiResponseToGifs = apiResponse => {
    const {data = []} = apiResponse
    if (Array.isArray(data)) {
      const gifs = data.map(image => {
        const {images, title, id} = image
        const { url } = images.downsized_medium
        return { title, id, url }
      })
      setGift(gifs[0].url)
      return gifs[0]
    }
    return []
  }

  const getGifs = ({
    limit = 15,
    rating = "g",
    keyword = "morty",
    page = 0,
  } = {}) => {
    const apiURL = `https://api.giphy.com/v1/gifs/search?api_key=VThN0Rg9LDb9mhmKYCkih5rw6oUkkHru&q=greeting&limit=25&offset=${
      page * limit
    }&rating=${rating}&lang=en`

    return fetch(apiURL)
      .then((res) => res.json())
      .then(fromApiResponseToGifs)
  }

  useEffect(() => {
    checkIfWalletIsConnected();
    console.log('use effect')
  }, [])

  const handleChange = (e) => {
    setMessage(e.target.value);
  }


  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          Wave Machine
        </div>

        <div className="bio">
            <img src={gift} alt='greeting' width='400px' height='300px'/>
        </div>

        <label>Message</label>
        <input type="text" placeholder="insert message" value={message} onChange={handleChange}/>
        <button className="waveButton" onClick={wave}>
          👋 Wave at Me
        </button>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        <h2> Total Waves {count}</h2>
        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "black", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
