// const { ethers } = require("hardhat")

async function main() {
  const _signer = await ethers.provider.getSigner();
  const _admin = await _signer.address;
  const _push = "0x37c779a1564DCc0e3914aB130e0e787d93e21804";
  const _votingPeriod = 50000;
  const _votingDelay = 30000;
  const _proposalThreshold = ethers.parseEther("800000");

  const _delay = 15;

  console.log("deploying logic");

  const logic = await ethers.deployContract("GovernorBravoDelegate");
  await logic.waitForDeployment();
  console.log("logic deployed on", logic.target);
  console.log("verifying logic");
  await logic.deploymentTransaction().wait(4);

  try {
    await hre.run("verify:verify", {
      address: logic.target,
      constructorArguments: [],
    });
  } catch (error) {
    console.log("Verification failed :", error);
  }

  console.log("deploying timelock");

  const timelock = await ethers.deployContract("Timelock", [_admin, _delay]);
  await timelock.waitForDeployment();

  console.log("timelock deployed to:", timelock.target);
  console.log("verifying timelock");
  await timelock.deploymentTransaction().wait(4);

  try {
    await hre.run("verify:verify", {
      address: timelock.target,
      constructorArguments: [_admin, _delay],
    });
  } catch (error) {
    console.log("Verification failed :", error);
  }

  console.log("deploying proxy Admin");

  const proxyAdmin = await ethers.deployContract("PushBravoAdmin");
  console.log("proxyAdmin deployed to:", proxyAdmin.target);

  console.log("verifying proxy Admin");
  await proxyAdmin.deploymentTransaction().wait(4);
  try {
    await hre.run("verify:verify", {
      address: proxyAdmin.target,
      constructorArguments: [],
      contract:"contracts/PushBravoAdmin.sol:PushBravoAdmin"
    });
  } catch (error) {
    console.log("Verification failed :", error);
  }


  console.log("deploying proxy");

  const proxy = await ethers.deployContract("PushBravoProxy", [
    logic.target,
    proxyAdmin.target,
    _admin,
    timelock.target,
    _push,
    _votingPeriod,
    _votingDelay,
    _proposalThreshold,
  ]);
  await proxy.waitForDeployment();

  console.log("proxy deployed to:", proxy.target);

  console.log("verifying proxy");
  await proxy.deploymentTransaction().wait(4);
  try {
    await hre.run("verify:verify", {
      address: proxy.target,
      constructorArguments: [
        logic.target,
        proxyAdmin.target,
        _admin,
        timelock.target,
        _push,
        _votingPeriod,
        _votingDelay,
        _proposalThreshold,
      ],
      contract:"contracts/PushBravoProxy.sol:PushBravoProxy"
    });
  } catch (error) {
    console.log("Verification failed :", error);
  }
}

main();
