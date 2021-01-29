// TODO: Implement a DAG here.



import sha256 from 'crypto-js/sha256';
/**
 * Basic interface for a post.
 * Each block contains a single post mediated by proof of work?
 * Long term would be cool to add some uniquely generated captcha hash, decentralised 
 * human verification possible?
 */
export interface Post {
  content: string
  image?: string
}

// Each block contains one post. This way we can use the structure of
// the DAC that is our blockchain to inform the structure of the content
export interface Block {
  depth: number
  timestamp: number // UNIX time
  post: Post
  proof: string // This is the current hash...
  previousHash: string
  parent: Block | null
  children: Block[]
}

interface BlockTree extends Array<Block | BlockTree> { }

const NONCE = '0000'

class BlockTree {
  root: Block

  nodes: any // Known nodes in our posting network. It's a set.


  constructor() {
    // Create our genesis block here
    this.root = this.newBlock({ previousHash: '1', proof: '100', post: { content: 'the ur post' }, parent: null })
  }


  /**
   * Create a new block and add it to our chain. Each block can only ever contain a single transaction.
   * Each block can have multiple valid children, but only a single valid parent. Because it's not a transaction
   * ledger, we don't care about double spend.
   * @param previousHash - the hash/proof of our last block
   * @param proof - Our current hash/proof
   */
  newBlock({ previousHash, proof, post, parent }: { previousHash: string, proof: string, post: Post, parent: Block }) {
    // Construct our new block
    const block: Block = {
      depth: parent?.depth + 1 || 0,
      timestamp: Date.now().valueOf(),
      post,
      proof,
      // Hash the entire previous block as proof of our lineage, including it's proof
      previousHash: previousHash || this.hashBlock(parent),
      parent,
      children: [],
    }
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
    let guessHash = sha256(guess).toString()
    return guessHash.slice(-4) === NONCE
  }

  /**
   * Our DAG's pointers are pointing backward, so we actually can't verify an entire tree. Instead, we can validate
   * "chains" based on leaf nodes we pick up from our peers
   * @param chain
   */
  validChain(leaf: Block) {
    let block = leaf
    let chain = []
    // check root... just in case
    if (this.findRootNode(leaf) !== this.root) {
      // TODO: What the heck do we do here lol? Full tree copy?
    }
    while (block.parent) {
      if (this.hashBlock(block.parent) !== block.previousHash) {
        // Invalid hash, dump the chain
      }
      if (!this.validProof(block.parent.proof, block.proof)) {
        // Invalid proof, bad chain, possible bad node. Reject this chain
      }
      chain.push(block.parent)
      block = block.parent
    }
    // If we're here, the chain is valid. We can append it to the tree.
    this.appendChainToTree(chain, this.root)
  }

  findRootNode(block: Block) {
    while (block.parent) block = block.parent
    return block
  }

  /**
   * Append a valid chain to the internally kept tree state
   * @param chain 
   * @param tree 
   */
  appendChainToTree(chain: Block[], tree: BlockTree) {
    // the last item in the chain should be the root node
    const currentChainNode = chain.pop()
    const currentTreeNode = this.root
    while (chain.length > 0) {
      if (currentChainNode.proof !== currentTreeNode.proof) {
        currentTreeNode.parent.children.push(currentChainNode)
      }
    }

  }


  hashBlock(block: Block): string {
    // Predictably order our block so that the hash will always be the same
    return sha256(JSON.stringify(block)).toString()
  }

}

export default BlockTree

