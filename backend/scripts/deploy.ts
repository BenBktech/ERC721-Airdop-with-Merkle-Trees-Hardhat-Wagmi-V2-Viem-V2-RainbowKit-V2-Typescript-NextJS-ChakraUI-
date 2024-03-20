import { ethers } from "hardhat";

// Types
import { BBKIsERC721 } from "../typechain-types";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

// Whitelisted addresses
import { whitelisted } from "../utils/whitelisted";

async function main() {
  
  let contract: BBKIsERC721;
  let merkleTree: StandardMerkleTree<string[]>
  merkleTree = StandardMerkleTree.of(whitelisted, ["address"], { sortLeaves: true });

  let baseURI: string = "ipfs://CID/";

  const [owner] = await ethers.getSigners();
  contract = await ethers.deployContract("BBKIsERC721", [owner.address, merkleTree.root, baseURI]);

  await contract.waitForDeployment();

  console.log(
    `BBKIsERC721 deployed to ${contract.target} with merkleRoot ${merkleTree.root}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
