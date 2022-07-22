import { expect } from 'chai';
import hre, { network } from 'hardhat';

import { AccessControlCheckerByDAOMember } from '../typechain/AccessControlCheckerByDAOMember';
import { AccessControlCheckerByDAOMember__factory } from '../typechain/factories/AccessControlCheckerByDAOMember__factory';

describe('AccessConntrolCheckerByDAOMember', function () {
    const DOCUMENT_ID = "0xac00000000000000000000000000000000000000000000000000000000000000";
    let accessConditionContract: AccessControlCheckerByDAOMember;

    it ('deploy contract', async function () {
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: ["0xc08a8a9f809107c5A7Be6d90e315e4012c99F39a"]
        });
        const deployerOrSigner = await hre.ethers.getSigner("0xc08a8a9f809107c5A7Be6d90e315e4012c99F39a");

        const accessConditionContractFactory = (await hre.ethers.getContractFactory(
            'AccessControlCheckerByDAOMember' 
        )) as AccessControlCheckerByDAOMember__factory;
        accessConditionContract = await accessConditionContractFactory
            .connect(deployerOrSigner)
            .deploy(
                "0x519F9662798c2E07fbd5B30C1445602320C5cF5B" // MolochDAO: Moloch Treasury V3
            );
        await accessConditionContract.deployed();
    })

    it("should checkAccessControl return true if user is moloch dao member", async () => {
        const molochDAOMember = "0x1db3439a222c519ab44bb1144fc28167b4fa6ee6";
        const isPermitted = await accessConditionContract.checkAccessControl(
            molochDAOMember, 
            DOCUMENT_ID
        );
        expect(isPermitted).true;
    });

    it("should checkAccessControl return false if user is not moloch dao member", async () => {
        const nonDAOMember = "0x00b3439a222c519ab44bb1144fc28167b4fa6ee6";
        const isPermitted = await accessConditionContract.checkAccessControl(
            nonDAOMember, 
            DOCUMENT_ID
        );
        expect(isPermitted).false;
    })
})