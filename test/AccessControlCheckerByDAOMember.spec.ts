import { expect } from 'chai';
import hre, { network } from 'hardhat';

import { AccessControlCheckerByDAOMember } from '../typechain/AccessControlCheckerByDAOMember';
import { AccessControlCheckerByDAOMember__factory } from '../typechain/factories/AccessControlCheckerByDAOMember__factory';
import { VWBLGateway } from '../typechain/VWBLGateway';
import { VWBLGateway__factory } from '../typechain/factories/VWBLGateway__factory'
import { parseEther } from '@ethersproject/units';

describe('AccessConntrolCheckerByDAOMember', function () {
    const DOCUMENT_ID1 = "0xac00000000000000000000000000000000000000000000000000000000000000";
    const DOCUMENT_ID2 = "0xbc00000000000000000000000000000000000000000000000000000000000000";
    const DAOMember = "0x1db3439a222c519ab44bb1144fc28167b4fa6ee6";
    const nonDAOMember = "0xe5F8086DAc91E039b1400febF0aB33ba3487F29A";
    let accessConditionContract: AccessControlCheckerByDAOMember;
    let vwblGatewayContract: VWBLGateway;

    it ('deploy contract', async function () {
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"]
        });
        const deployerOrSigner = await hre.ethers.getSigner("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

        const vwblGatewayContractFactory = (await hre.ethers.getContractFactory(
            'VWBLGateway'
        )) as VWBLGateway__factory
        vwblGatewayContract = await vwblGatewayContractFactory
            .connect(deployerOrSigner)
            .deploy(
                parseEther("1")
            );
        await vwblGatewayContract.deployed();

        const accessConditionContractFactory = (await hre.ethers.getContractFactory(
            'AccessControlCheckerByDAOMember' 
        )) as AccessControlCheckerByDAOMember__factory;
        accessConditionContract = await accessConditionContractFactory
            .connect(deployerOrSigner)
            .deploy(
                "0x519F9662798c2E07fbd5B30C1445602320C5cF5B", // MolochDAO: Moloch Treasury V3
                vwblGatewayContract.address
            );
        await accessConditionContract.deployed();
    })

    it ("should grant access control to dao member from dao member", async () => {
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [DAOMember]
        });
        const DAOMemberSigner = await hre.ethers.getSigner(DAOMember);

        await accessConditionContract.connect(DAOMemberSigner).grantAccessControlToDAOMember(
            DOCUMENT_ID1,
            DAOMember, // author
            "dao's document name", // name
            "https://xxx.yyy.zzz", // encryptedDataUrl
            {
                value: parseEther("1")
            }
        );
        
        const documentInfo = await accessConditionContract.documentIdToInfo(DOCUMENT_ID1);
        expect(documentInfo.author.toLocaleLowerCase()).eq(DAOMember);
        expect(documentInfo.name).eq("dao's document name");
        expect(documentInfo.encryptedDataUrl).eq("https://xxx.yyy.zzz");
    })

    it ("should not grant access control from non dao member", async () => {
        await network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [nonDAOMember]
        });
        const nonDAOMemberSigner = await hre.ethers.getSigner(nonDAOMember);

        await expect(accessConditionContract.connect(nonDAOMemberSigner).grantAccessControlToDAOMember(
            DOCUMENT_ID2,
            nonDAOMember,
            "document name",
            "https://aaa.bbb.ccc",
            {
                value: parseEther("1")
            }
        )).to.be.revertedWith('msg.sender is not a DAO member');
    })


    it("should hasAccessControl return true if user is moloch dao member", async () => {
        const isPermitted = await vwblGatewayContract.hasAccessControl(
            DAOMember, 
            DOCUMENT_ID1
        );
        expect(isPermitted).true;
    });

    it("should hasAccessControl return false if user is not moloch dao member", async () => {
        const isPermitted = await vwblGatewayContract.hasAccessControl(
            nonDAOMember, 
            DOCUMENT_ID1
        );
        expect(isPermitted).false;
    })
})