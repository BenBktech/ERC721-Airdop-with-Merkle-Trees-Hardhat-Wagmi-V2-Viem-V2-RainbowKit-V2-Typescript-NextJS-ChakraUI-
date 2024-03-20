'use client'
// ReactJS
import { useState, useEffect } from "react"

// ChakraUI
import { Flex, Text, Button, Spinner, useToast, Alert, AlertIcon } from "@chakra-ui/react"

// Wagmi
import { useAccount, useReadContract, type BaseError, useWriteContract, useWaitForTransactionReceipt } from "wagmi"

// Contract informations
import { contractAddress, contractAbi, whitelisted } from "@/constants"

// Viem
import { formatEther } from "viem"

// Merkle Tree by OZ
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

// Layout
import Layout from "./Layout"

const Mint = () => {

  const { address } = useAccount()
  const toast = useToast();

  const [merkleProof, setMerkleProof] = useState<string[]>([]);
  const [merkleError, setMerkleError] = useState<string>('');

  // Get the total amount of the BBK tokens airdroppped
  const { data: totalSupply, isLoading: totalSupplyLoading, refetch: refetchTotalSupply } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'totalSupply',
    account: address
  })

  const formatTotalSupply = (supply: bigint | undefined): string => {
    if (supply !== undefined) {
      return supply.toString();
    }
    return "0";
  };

  // Mint
  const { data: hash, error: airdropError, isPending, writeContract } = useWriteContract({
    mutation: {
      // Si ça a marché d'écrire dans le contrat
      onSuccess: () => {
          toast({
              title: "Transaction has been sent.",
              status: "success",
              duration: 3000,
              isClosable: true,
          });
      },
      // Si erreur
      onError: (error) => {
          toast({
              title: error.shortMessage,
              status: "error",
              duration: 3000,
              isClosable: true,
          });
      },
    }
  }) 

  const getAirdrop = async() => {
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: 'safeMint',
      account: address,
      args: [address, merkleProof]
    });
  }

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash, 
  })

  useEffect(() => {
    if(isConfirmed) {
      refetchTotalSupply();
      toast({
        title: "You have successfully minted your NFT!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [isConfirmed])

  useEffect(() => {
    if(address) {
      try {
        const tree = StandardMerkleTree.of(whitelisted, ["address"], { sortLeaves: true });
        const proof = tree.getProof([address]);
        setMerkleProof(proof);
      }
      catch {
        setMerkleError('You are not eligible to an airdrop of this NFT Collection.');
      }
    }
  }, [])

  return (
    <Flex
      direction="column"
      width={['100%', '100%', '50%', '50%']}
    >
      {totalSupplyLoading ? (
        <Flex justifyContent="center">
          <Spinner
            thickness='4px'
            speed='0.65s'
            emptyColor='gray.200'
            color='blue.500'
            size='xl'
          />
        </Flex>
      ) : (
        <>
          <Flex justifyContent="center">
            <Text mt="1rem">Amount Airdrop given : <Text as='b'>{formatTotalSupply(totalSupply as bigint | undefined)} NFTs</Text></Text>
          </Flex>
          {merkleError ? (
            <Alert status='error' mt="1rem">
              <AlertIcon />
              You are not eligible for an airdrop.
            </Alert>
          ) : (
            <>
              {hash && (
                <Alert status='success' mt="1rem">
                  <AlertIcon />
                  Hash : {hash}
                </Alert>
              )}
              {isConfirming && (
                <Alert status='success' mt="1rem">
                  <AlertIcon />
                  Waiting for confirmation...
                </Alert>
              )} 
              {isConfirmed && (
                <Alert status='success' mt="1rem">
                  <AlertIcon />
                  Check your wallet, you have received 1 NFT!
                </Alert>
              )} 
              {airdropError && (
                <Alert status='error' mt="1rem">
                  <AlertIcon />
                  Error: {(airdropError as BaseError).shortMessage || airdropError.message}
                </Alert>
              )}
              <Button onClick={() => getAirdrop()} mt="1rem">{isPending ? 'Minting...' : 'Mint'}</Button>
            </>
          )}
        </>
      )}
    </Flex>
  )
}

export default Mint