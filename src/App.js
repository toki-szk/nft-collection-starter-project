// useEffect と useState 関数を React.js からインポートしています。
import myEpicNft from "./utils/MyEpicNFT.json";
import React, { useEffect, useState } from "react";
import "./styles/App.css";
import { ethers } from "ethers";
import twitterLogo from "./assets/twitter-logo.svg";
// Constantsを宣言する: constとは値書き換えを禁止した変数を宣言する方法です。
const TWITTER_HANDLE = "_tknsn_";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = "";
const TOTAL_MINT_COUNT = 50;
const CONTRACT_ADDRESS = "0xfaebD7c71dA7aaF63119f4bf0591462B36BD4e57";
const MINT_LIMIT = 10;
const App = () => {
  /*
   * ユーザーのウォレットアドレスを格納するために使用する状態変数を定義します。
   */
  const [currentAccount, setCurrentAccount] = useState("");
  const [currentMintedNum, setCurrentMintedNum] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  /*この段階でcurrentAccountの中身は空*/
  console.log("currentAccount: ", currentAccount);
  /*
   * ユーザーが認証可能なウォレットアドレスを持っているか確認します。
   */
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      console.log("Make sure you have MetaMask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }
    /* ユーザーが認証可能なウォレットアドレスを持っている場合は、
     * ユーザーに対してウォレットへのアクセス許可を求める。
     * 許可されれば、ユーザーの最初のウォレットアドレスを
     * accounts に格納する。
     */
    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  };

  const checkCurrentNetwork = async () => {
    const { ethereum } = window;
    let chainId = await ethereum.request({ method: "eth_chainId" });
    console.log("Connected to chain " + chainId);
    // 0x4 は　Rinkeby の ID です。
    const rinkebyChainId = "0x4";
    if (chainId !== rinkebyChainId) {
      alert("You are not connected to the Rinkeby Test Network!");
    }
  };

  /*
   * connectWallet メソッドを実装します。
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }
      /*
       * ウォレットアドレスに対してアクセスをリクエストしています。
       */
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      console.log("Connected", accounts[0]);
      /*
       * ウォレットアドレスを currentAccount に紐付けます。
       */
      setCurrentAccount(accounts[0]);
      setupEventListener();
    } catch (error) {
      console.log(error);
    }
  };

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        // NFT が発行されます。
        const connectedContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          myEpicNft.abi,
          signer
        );
        const mintedNum = await connectedContract.fetchCurrentMintNum();

        setCurrentMintedNum(mintedNum.toNumber());

        // Event が　emit される際に、コントラクトから送信される情報を受け取っています。
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          alert(
            `あなたのウォレットに NFT を送信しました。OpenSea に表示されるまで最大で10分かかることがあります。NFT へのリンクはこちらです: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`
          );
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;
      setIsLoading(true);
      if (ethereum) {
        if (MINT_LIMIT > currentMintedNum) {
          const provider = new ethers.providers.Web3Provider(ethereum);
          const signer = provider.getSigner();
          const connectedContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            myEpicNft.abi,
            signer
          );
          console.log("Going to pop wallet now to pay gas...");
          let nftTxn = await connectedContract.makeAnEpicNFT();
          console.log("Mining...please wait.");
          await nftTxn.wait();

          console.log(
            `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`
          );
          const mintedNum = await connectedContract.fetchCurrentMintNum();
          setCurrentMintedNum(mintedNum.toNumber());
        } else {
          alert(`mintできるのは${MINT_LIMIT}個までです。`);
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  // renderNotConnectedContainer メソッドを定義します。
  const renderNotConnectedContainer = () => (
    <button
      onClick={connectWallet}
      className="cta-button connect-wallet-button"
    >
      Connect to Wallet
    </button>
  );
  /*
   * ページがロードされたときに useEffect()内の関数が呼び出されます。
   */
  useEffect(() => {
    checkCurrentNetwork();
    checkIfWalletIsConnected();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">あなただけの特別な NFT を Mint しよう💫</p>
          {currentAccount === "" ? (
            renderNotConnectedContainer()
          ) : isLoading ? (
            <p className="sub-text">Loading ...</p>
          ) : (
            <button
              onClick={askContractToMintNft}
              className="cta-button connect-wallet-button"
            >
              Mint NFT
            </button>
          )}
        </div>
        <div className="sub-text">
          mint数:{currentMintedNum} / {MINT_LIMIT}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};
export default App;
