// Hardhat & Test
import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect, assert } from "chai";
import { ethers } from "hardhat";

// Types
import { BBKIsERC721 } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

// Whitelisted addresses
import { whitelisted } from "../utils/whitelisted";

describe("BBKIsERC721 Tests", function () {
  let contract: BBKIsERC721;

  let owner: SignerWithAddress; // whitelisted
  let addr1: SignerWithAddress; // whitelisted
  let addr2: SignerWithAddress; // NOT whitelisted

  let merkleTree: StandardMerkleTree<string[]>

  async function deployContractFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    merkleTree = StandardMerkleTree.of(whitelisted, ["address"], { sortLeaves: true });
    let baseURI = "ipfs://CID/";

    const contractFactory = await ethers.getContractFactory("BBKIsERC721");
    const contract = await contractFactory.deploy(owner.address, merkleTree.root, baseURI);

    return {contract, merkleTree, owner, addr1, addr2, baseURI };
  }

  // Deployment
  describe("Deployment", function () {
    it('should deploy the smart contract', async function() {
      const { contract, merkleTree, owner, addr1, addr2, baseURI } = await loadFixture(deployContractFixture);
      let contractMerkleTree = await contract.merkleRoot();
      assert(contractMerkleTree === merkleTree.root);
      let contractOwner = await contract.owner();
      assert(contractOwner === owner.address);
      let contractBaseURI = await contract.baseURI();
      assert(contractBaseURI === baseURI);
    })
  });

  // Mint
  describe("Mint", function() {
    it('should NOT mint NFT if NOT whitelisted | @openzeppelin/merkle-tree library Test', async function() {
      const { contract, merkleTree, owner, addr1, addr2, baseURI } = await loadFixture(deployContractFixture);
      try {
        const proof = merkleTree.getProof([addr2.address]);
        expect.fail("Expected an error 'Error: Leaf is not in tree' but none was thrown.");
      } catch (error) {
        // Assertion de type pour que TypeScript traite `error` comme une instance de `Error`
        const err = error as Error;
        expect(err.message).to.include("Leaf is not in tree");
      }
    })

    it('should NOT mint NFT if NOT whitelisted | contract Test', async function() {
      const { contract, merkleTree, owner, addr1, addr2, baseURI } = await loadFixture(deployContractFixture);
      const proof: string[] = [];
      await expect(contract.connect(addr2).safeMint(addr2.address, proof)).to.be.revertedWith('Not Whitelisted');
    })

    it('should NOT mint NFT if NFT already minted', async function() {
      const { contract, merkleTree, owner, addr1, addr2, baseURI } = await loadFixture(deployContractFixture);
      const proof = merkleTree.getProof([addr1.address]);

      await contract.connect(addr1).safeMint(addr1.address, proof)

      await expect(contract.connect(addr1).safeMint(addr1.address, proof)).to.be.revertedWith('NFT already minted');
    })

    it('should mint NFT if the user is whitelisted and has not minted yet', async function() {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(deployContractFixture);
      const proof = merkleTree.getProof([addr1.address]);

      await contract.connect(addr1).safeMint(addr1.address, proof)

      let balance = await contract.balanceOf(addr1.address);
      assert(balance.toString() === "1")

      let totalSupply = await contract.totalSupply();
      assert(totalSupply.toString() === "1")
    })
  })

  // Set Merkle Root
  describe('setMerkleRoot', function() {
    it('should NOT set the merkle root if the caller is NOT the owner', async function() {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(deployContractFixture);

      await expect(contract.connect(addr1).setMerkleRoot(merkleTree.root)).to.be.revertedWithCustomError(
        contract,
        'OwnableUnauthorizedAccount'
      ).withArgs(
        addr1.address
      )
    })

    it('should set the merkle root if the caller is the owner', async function() {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(deployContractFixture);
      let newMerkleRoot = "0xd1000e3d5650743475aa0addfeef7e36cbfc4e060939615f4c3651e4b529d61c";
      await contract.setMerkleRoot(newMerkleRoot);

      let contractMerkleRoot = await contract.merkleRoot()
      assert(newMerkleRoot === contractMerkleRoot);
    })
  })

  // TokenURI
  describe('TokenURI', function() {
    it('should mint an NFT and get the tokenURI of the NFT', async function() {
      const { contract, merkleTree, owner, addr1, addr2 } = await loadFixture(deployContractFixture);
      const proof = merkleTree.getProof([addr1.address]);

      await contract.connect(addr1).safeMint(addr1.address, proof)

      let tokenURI = await contract.tokenURI(0);
      assert(tokenURI === "ipfs://CID/0.json");
    })
  });
});
