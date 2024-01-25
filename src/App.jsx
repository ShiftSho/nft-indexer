import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network } from 'alchemy-sdk';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function App() {
  const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY;
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  async function connectWallet() {
    if (window.ethereum) {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            // Request account access
            await provider.send('eth_requestAccounts', []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            setUserAddress(address);
            setIsWalletConnected(true); // Set connected state to true
        } catch (error) {
            console.error('User denied account access');
        }
    } else {
        console.log('Please install MetaMask!');
    }
}

function disconnectWallet() {
  // Clear user address and set wallet connection state to false
  setUserAddress('');
  setIsWalletConnected(false);
  
  // Reset NFT data
  setResults([]);
  setTokenDataObjects([]);
  setHasQueried(false);

  // Inform the user (optional)
  alert('Disconnected. Please also disconnect from your wallet extension if necessary.');
}

function isValidAddress(address) {
  return /^(0x)?[0-9a-f]{40}$/i.test(address);
}

  async function getNFTsForOwner() {
    if (!isValidAddress(userAddress)) {
      setErrorMessage('Please input a valid Ethereum wallet address');
      return;
    }
  
    setErrorMessage('');

    const config = {
      apiKey: alchemyApiKey,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.nft.getNftsForOwner(userAddress);
    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.ownedNfts.length; i++) {
      const tokenData = alchemy.nft.getNftMetadata(
        data.ownedNfts[i].contract.address,
        data.ownedNfts[i].tokenId
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
  }

  useEffect(() => {
    if (userAddress) {
      getNFTsForOwner();
    }
  }, [userAddress]);


  return (
    <Box w="100vw">
      <Flex
          position="absolute"
          top={4}  // Adjust these values as needed for spacing from the top
          right={4} // Adjust these values as needed for spacing from the right
          alignItems="center"
          justifyContent="flex-end"
      >
          <Button
            fontSize={20}
            onClick={isWalletConnected ? disconnectWallet : connectWallet}
            mt={36}
            bgColor="darkCobalt"
            color="white"
          >
            {isWalletConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
          </Button>
      </Flex>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        {errorMessage && (
          <Text color="darkRed" fontSize="md" mb={4} style={{ textShadow: '0 0 2px red, 0 0 4px red, 0 0 15px red' }}>
            {errorMessage}
          </Text>
        )}

        {/* ... rest of your component ... */}
      </Flex>
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={0} fontSize={36}>
          🦧 NFT Indexer 🦧
          </Heading>
          <Text>
            Plug in any user's address and view all their NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getNFTsForOwner} mt={36} bgColor="darkCobalt">
          Fetch NFTs
        </Button>

        <Heading my={36}>Here are your NFTs:</Heading>

        {hasQueried ? (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.ownedNfts.map((e, i) => {
              return (
                <Flex
                  flexDir={'column'}
                  color="white"
                  bg="darkCobalt"
                  w={'20vw'}
                  key={e.id}
                >
                  <Box>
                    <b>Name:</b>{' '}
                    {tokenDataObjects[i].title?.length === 0
                      ? 'Name Unavailable'
                      : tokenDataObjects[i].title}
                  </Box>
                  <Image
                    src={
                      tokenDataObjects[i]?.rawMetadata?.image ?? 
                      '/public/dosomething.gif'
                    }
                    fallbackSrc="/public/dosomething.gif"
                    alt={'Image'}
                  />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          'Please make a query! The query may take a few seconds...'
        )}
      </Flex>
    </Box>
  );
}

export default App;
