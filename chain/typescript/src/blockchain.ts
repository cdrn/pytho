import sha256 from 'crypto-js/sha256';
/**
 * Basic interface for a transaction.
 * image contains a displayable, hosted image formate
 * string
 */
export interface Post {
  content: string
  image?: string
}

// Each block contains one post. This way we can use the structure of
// the DAC that is our blockchain to inform the structure of the content
export interface Block {
  index: number
  timestamp: number // UNIX time
  post: Post
  proof: string // This is the current hash...
  previousHash: string
}

class Blockchain {
  chain: Array<Block>
  nodes: any // Known nodes in our posting network. It's a set.


  constructor() {
    // Create our genesis block here
    this.newBlock({ previousHash: '1', proof: '100', post: { content: 'the ur post' } })
  }


  /**
   * Create a new block and add it to our chain.
   * @param previousHash - the hash/proof of our last block
   * @param proof - Our current hash/proof
   */
  async newBlock({ previousHash, proof, post }: { previousHash: string, proof: string, post: Post }) {
    // Construct our new block
    const block: Block = {
      index: this.chain.length + 1,
      timestamp: Date.now().valueOf(),
      post,
      proof,
      // Hash the entire previous block as proof of our lineage, including it's proof
      previousHash: previousHash || this.hashBlock(this.chain[this.chain.length - 1])
    }
    this.chain.push(block)
    return block
  }

  /**
   * Generate a proof of work for the block/post that we want to make.
   * We do this by incrementing our "proof" integer until we find an integer which, 
   * when combined with the previous proof hashes to a value with certain attributes, in this case
   * TODO: Make async later maybe
   * @param previousProof The proof of the parent block
   */
  proofOfWork(previousProof: string) {
    let proof = 0
    // TODO: could make this async later?
    while (this.validProof(previousProof, String(proof)) === false) {
      proof += 1
    }
    return proof
  }

  /**
   * Hash a concat of the previous and current proof. If the hash meets our 
   * criteria (4 trailing 0's), we have a valid proof. Return true. This means
   * that a block has been "mined", or in this case, is verified and valid, and can enter
   * the DAG
   * @param previousProof - Proof of the previous block
   * @param proof - Proof we want to test
   */
  validProof(previousProof: string, proof: string) {
    let guess = `${previousProof}${proof}`
    let guessHash = sha256(guess)
    return guessHash.slice(-4) == '0000'
  }



  hashBlock(block: Block) {
    // Predictably order our block so that the hash will always be the same
    return sha256(JSON.stringify(block))
  }

}

