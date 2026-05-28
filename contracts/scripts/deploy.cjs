const hre = require('hardhat');

async function main() {
  const VotingElection = await hre.ethers.getContractFactory('VotingElection');
  const contract = await VotingElection.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log('VotingElection deployed to:', address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
