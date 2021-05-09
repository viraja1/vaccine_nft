const VaccineNFT = artifacts.require("VaccineNFT");

module.exports = function(deployer) {
    return deployer.then(() => deployer.deploy(VaccineNFT));
};