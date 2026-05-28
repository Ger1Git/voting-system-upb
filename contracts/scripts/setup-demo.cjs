const hre = require('hardhat');

async function main() {
  const address = process.env.VOTING_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const [deployer] = await hre.ethers.getSigners();
  const contract = await hre.ethers.getContractAt('VotingElection', address, deployer);

  const tx1 = await contract.createElection('Demo Election', 1700000000, 2000000000);
  await tx1.wait();
  const electionId = await contract.electionCount();
  const id = Number(electionId);

  for (const name of ['Alice', 'Bob', 'Charlie']) {
    const tx = await contract.addCandidate(id, name);
    await tx.wait();
  }

  await (await contract.openVoting(id)).wait();

  console.log('Demo election ready:', id);
  console.log('Candidates:', Number((await contract.elections(id)).candidateCount));
}

main().catch(console.error);
